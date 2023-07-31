import {
  camelCase,
  kebabCase,
  pascalCase,
  snakeCase,
  capitalCase,
} from 'case-anything';

export type CaseType =
  | 'kebab'
  | 'snake'
  | 'camel'
  | 'pascal'
  | 'capital'
  | 'kebab-or-snake';

/**
 *
 * @param str
 * @param caseType
 * @returns formatted string
 * @description normalizes input to a given case format.
 * Available formats are: 'kebab' | 'snake' | 'camel' | 'pascal' | 'capital'.
 */
export const normalizeToCase = (
  str: string,
  caseType: CaseType = 'kebab-or-snake',
) => {
  switch (caseType) {
    case 'kebab':
      return kebabCase(str);
    case 'snake':
      return snakeCase(str);
    case 'camel':
      return camelCase(str);
    case 'pascal':
      return pascalCase(str);
    case 'capital':
      return capitalCase(str);
    // For legacy purposes
    case 'kebab-or-snake':
      return normalizeToKebabOrSnakeCase(str);
    default:
      throw new Error(`Error! case type ${caseType} is not supported.`);
  }
};

export const formatString = (str: string) => {
  return str.split('').reduce((content, char) => {
    if (char === '(' || char === ')' || char === '[' || char === ']') {
      return `${content}\\${char}`;
    }
    return `${content}${char}`;
  }, '');
};

/**
 *
 * @param str
 * @returns formatted string
 * @description normalizes input to supported path and file name format.
 * Changes camelCase strings to kebab-case, replaces spaces with dash and keeps underscores.
 */
export function normalizeToKebabOrSnakeCase(str: string) {
  const STRING_DASHERIZE_REGEXP = /\s/g;
  const STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
  return str
    .replace(STRING_DECAMELIZE_REGEXP, '$1-$2')
    .toLowerCase()
    .replace(STRING_DASHERIZE_REGEXP, '-');
}
