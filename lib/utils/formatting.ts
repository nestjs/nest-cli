import { CaseToCase } from 'case-to-case'

const formatter = new CaseToCase()

/**
 *
 * @param str
 * @param fileNameCase
 * @returns formated string
 * @description normalizes input to supported path and file name format.
 * Changes string to specified case.
 */
export function normalizeFileName(str: string, fileNameCase: string) {

  console.log({ str, fileNameCase })

  switch (fileNameCase) {
    case 'kebab-case':
      return normalizeToKebabOrSnakeCase(str);
    case 'snake-case':
      return normalizeToKebabOrSnakeCase(str);
    case 'camelCase':
      console.log('camelCase!!!')
      return formatter.toCamelCase(str);
    case 'PascalCase':
      return formatter.toPascalCase(str);
    case 'UPPERCASE':
      return formatter.toUpperCase(str);
    default:
      console.log(`Case not found! ${fileNameCase}`);
      return normalizeToKebabOrSnakeCase(str);
  }

}

export function normalizeToKebabOrSnakeCase(str: string) {
  const STRING_DASHERIZE_REGEXP = /\s/g;
  const STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
  return str
      .replace(STRING_DECAMELIZE_REGEXP, '$1-$2')
      .toLowerCase()
      .replace(STRING_DASHERIZE_REGEXP, '-');
}
