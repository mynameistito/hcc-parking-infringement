import { spawn } from "node:child_process";
import path from "node:path";

import { waitForClose } from "@scripts/lib/process-close.ts";

import { MANIFEST_FILE, seedObjectKey } from "@/server/seed-manifest.ts";

/**
 * Upload exported seed files to the configured R2 bucket.
 * @param options - Operation settings and progress callbacks.
 */
export const uploadSeedDirectory = async (options: {
  bucket: string;
  dir: string;
  files: string[];
  prefix: string;
}): Promise<void> => {
  const rootDir = path.resolve(import.meta.dirname, "..", "..", "..");

  await Promise.all(
    options.files.map(async (file) => {
      const localPath = path.join(options.dir, file);
      const remoteKey = seedObjectKey(options.prefix, file);

      console.log(
        `[seed] upload ${file} → r2://${options.bucket}/${remoteKey}`
      );

      const code = await waitForClose(
        spawn(
          process.execPath,
          [
            "x",
            "wrangler",
            "r2",
            "object",
            "put",
            `${options.bucket}/${remoteKey}`,
            `--file=${localPath}`,
            "--remote",
          ],
          { cwd: rootDir, stdio: "inherit" }
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
