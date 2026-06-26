import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";

import { MANIFEST_FILE, seedObjectKey } from "@/server/seed-manifest.ts";

const isCloseEvent = (event: unknown): event is [number | null] =>
  Array.isArray(event) && event.length > 0;

const waitForClose = async (
  child: ReturnType<typeof spawn>
): Promise<number> => {
  const event: unknown = await once(child, "close");
  if (!isCloseEvent(event)) {
    return 1;
  }

  const [code] = event;
  return typeof code === "number" ? code : 1;
};

export const uploadSeedDirectory = async (options: {
  bucket: string;
  dir: string;
  files: string[];
  prefix: string;
}): Promise<void> => {
  const rootDir = path.resolve(import.meta.dirname, "..", "..");

  await Promise.all(
    options.files.map(async (file) => {
      const localPath = path.join(options.dir, file);
      const remoteKey = seedObjectKey(options.prefix, file);

      console.log(
        `[seed] upload ${file} → r2://${options.bucket}/${remoteKey}`
      );

      const code = await waitForClose(
        spawn(
          "bunx",
          [
            "wrangler",
            "r2",
            "object",
            "put",
            `${options.bucket}/${remoteKey}`,
            `--file=${localPath}`,
            "--remote",
          ],
          { cwd: rootDir, shell: true, stdio: "inherit" }
        )
      );

      if (code !== 0) {
        throw new Error(
          `wrangler r2 object put failed for ${file} (exit ${code})`
        );
      }
    })
  );

  console.log(
    `[seed] uploaded manifest at r2://${options.bucket}/${seedObjectKey(options.prefix, MANIFEST_FILE)}`
  );
};
