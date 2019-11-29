import { CommanderStatic } from 'commander';

export function getRemainingFlags(cli: CommanderStatic) {
  const rawArgs = [...cli.rawArgs];
  return rawArgs
    .splice(
      Math.max(
        rawArgs.findIndex((item: string) => item.startsWith('--')),
        0,
      ),
    )
    .filter((item: string, index: number, array: string[]) => {
      // If the option is consumed by commander.js, then we skip it
      if (cli.options.find((o: any) => o.short === item || o.long === item)) {
        return false;
      }

      // If it's an argument of an option consumed by commander.js, then we
      // skip it too
      const prevKeyRaw = array[index - 1];
      if (prevKeyRaw) {
        const previousKey = camelCase(
          prevKeyRaw.replace('--', '').replace('no', ''),
        );
        if (cli[previousKey] === item) {
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
  return flag.split('-').reduce((str, word) => {
    return str + word[0].toUpperCase() + word.slice(1);
  });
}
