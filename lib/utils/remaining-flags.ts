import { Command } from 'commander';

export function getRemainingFlags(cli: Command) {
  const rawArgs = [
    ...((cli as any).rawArgs?.length
      ? (cli as any).rawArgs
      : ((cli.parent as any)?.rawArgs ?? [])),
  ];

  const spliceIndex = rawArgs.findIndex((item: string) =>
    item.startsWith('--'),
  );
  if (spliceIndex === -1) {
    return [];
  }

  const commands: Command[] = [
    cli,
    ...(((cli as any).commands as Command[]) ?? []),
    ...(cli.parent ? [cli.parent] : []),
  ];

  const findOption = (flag: string) => {
    const flagName = flag.split('=', 1)[0];
    for (const cmd of commands) {
      const match = cmd.options?.find(
        (o: any) => o.short === flagName || o.long === flagName,
      );
      if (match) {
        return match;
      }
    }
    return undefined;
  };

  return rawArgs
    .splice(spliceIndex)
    .filter((item: string, index: number, array: string[]) => {
      // If the option is consumed by commander.js, then we skip it
      if (findOption(item)) {
        return false;
      }

      // If it's an argument of an option consumed by commander.js, then we
      // skip it too
      const prevKeyRaw = array[index - 1];
      if (prevKeyRaw?.startsWith('-')) {
        const matchedOption = findOption(prevKeyRaw);
        const keySource = matchedOption?.long ?? prevKeyRaw;
        const previousKey = camelCase(
          keySource.replace(/--/g, '').replace('no', ''),
        );
        const isConsumedValue = commands.some((cmd) => {
          const optionValue = cmd.getOptionValue?.(previousKey);
          return Array.isArray(optionValue)
            ? optionValue.includes(item)
            : optionValue === item;
        });
        if (isConsumedValue) {
          return false;
        }
      }

      return true;
    });
}

/**
 * Camel-case the given `flag`
 *
 * @param {String} flag
 * @return {String}
 * @api private
 */

function camelCase(flag: string) {
  const words = flag.split('-').filter((word) => word.length > 0);

  if (words.length === 0) {
    return '';
  }

  return words.reduce((str, word) => {
    return str + word[0].toUpperCase() + word.slice(1);
  });
}
