/** Shared CLI argument parsing for `scripts/` entrypoints. */

/** Return `process.argv` tokens after the runtime and script path. */
export const scriptArgv = (): string[] => process.argv.slice(2);

/** Read `--name=value` from argv; returns undefined when absent. */
export const readArg = (
  args: readonly string[],
  name: string
): string | undefined => {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

/** Read `--name=value` or `--name value` from argv. */
export const readArgValue = (
  args: readonly string[],
  name: string
): string | undefined => {
  const fromEquals = readArg(args, name);
  if (fromEquals !== undefined) {
    return fromEquals;
  }

  const flagIndex = args.indexOf(`--${name}`);
  if (flagIndex === -1) {
    return undefined;
  }

  return args[flagIndex + 1];
};

/** Read `--name=value` with a string fallback. */
export const readArgWithDefault = (
  args: readonly string[],
  name: string,
  fallback: string
): string => readArg(args, name) ?? fallback;

/** Return true when `--name` is present in argv. */
export const readFlag = (args: readonly string[], name: string): boolean =>
  args.includes(`--${name}`);
