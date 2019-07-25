import { CommanderStatic } from 'commander';

export function getRemainingFlags(cli: CommanderStatic) {
  return cli.rawArgs
    .splice(
      Math.max(
        cli.rawArgs.findIndex((item: string) => item.startsWith('--')),
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
        const previousKey = camelcase(
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

function camelcase(flag: string) {
  return flag.split('-').reduce((str, word) => {
    return str + word[0].toUpperCase() + word.slice(1);
  });
}
