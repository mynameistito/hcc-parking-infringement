/** Shared CLI argument parsing for `scripts/` entrypoints. */

/**
 * Read the arguments supplied to the script.
 * @returns Tokens after the runtime and script path.
 */
export const scriptArgv = (): string[] => process.argv.slice(2);

/**
 * Read an equals-delimited option.
 * @param args - Script argument tokens.
 * @param name - Option name without leading dashes.
 * @returns The option value, or undefined when absent.
 */
export const readArg = (
  args: readonly string[],
  name: string
): string | undefined => {
  const prefix = `--${name}=`;

  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

/**
 * Read an equals-delimited or space-delimited option.
 * @param args - Script argument tokens.
 * @param name - Option name without leading dashes.
 * @returns The option value, or undefined when absent.
 */
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

/**
 * Read an equals-delimited option with a fallback.
 * @param args - Script argument tokens.
 * @param name - Option name without leading dashes.
 * @param fallback - Value used when the option is absent.
 * @returns The supplied option value or the fallback.
 */
export const readArgWithDefault = (
  args: readonly string[],
  name: string,
  fallback: string
): string => readArg(args, name) ?? fallback;

/**
 * Check whether a boolean option was supplied.
 * @param args - Script argument tokens.
 * @param name - Option name without leading dashes.
 * @returns Whether the flag is present.
 */
export const readFlag = (args: readonly string[], name: string): boolean =>
  args.includes(`--${name}`);
