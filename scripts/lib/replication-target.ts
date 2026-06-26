/** Resolve local/remote worker URLs for replication scripts. */

import {
  defaultLocalPushSourceUrl,
  isLocalWorkerUrl,
} from "@scripts/dev-env.ts";
import { readArg } from "@scripts/lib/args.ts";

export const resolveReplicationSourceUrl = (
  args: readonly string[]
): string => {
  const explicit = readArg(args, "from");
  if (explicit !== undefined) {
    return explicit.replace(/\/$/u, "");
  }

  const fromPort = readArg(args, "from-port");
  if (fromPort !== undefined) {
    return `http://127.0.0.1:${fromPort}`;
  }

  return defaultLocalPushSourceUrl();
};

export const resolveReplicationTargetUrl = (
  args: readonly string[]
): string => {
  const explicit = readArg(args, "to");
  if (explicit !== undefined) {
    return explicit.replace(/\/$/u, "");
  }

  const workerUrl = process.env.WORKER_URL;
  if (
    workerUrl === undefined ||
    workerUrl.includes("127.0.0.1") ||
    workerUrl.includes("localhost")
  ) {
    throw new Error(
      "Set --to=https://your-worker.workers.dev or WORKER_URL to the remote deployment."
    );
  }

  return workerUrl.replace(/\/$/u, "");
};

export const resolveImportJsonTargetUrl = (args: readonly string[]): string => {
  const explicit = readArg(args, "to");
  if (explicit !== undefined) {
    return explicit.replace(/\/$/u, "");
  }

  const workerUrl = process.env.WORKER_URL;
  if (workerUrl !== undefined && !isLocalWorkerUrl(workerUrl)) {
    return workerUrl.replace(/\/$/u, "");
  }

  throw new Error(
    "Set --to=https://your-worker.workers.dev or WORKER_URL to the import target."
  );
};
