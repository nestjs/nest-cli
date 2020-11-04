import { Input } from '../../../commands';
import { Configuration } from '../../configuration';

export function getValueOrDefault<T = any>(
  configuration: Required<Configuration>,
  propertyPath: string,
  appName: string,
  key?: 'path' | 'webpack' | 'webpackPath',
  options: Input[] = [],
  defaultValue?: T,
): T {
  const item = options.find((option) => option.name === key);
  const origValue = item && ((item.value as unknown) as T);
  if (origValue !== undefined && origValue !== null) {
    return origValue as T;
  }
  if (configuration.projects && configuration.projects[appName]) {
    const perAppValue = getValueOfPath(
      configuration,
      `projects.${appName}.`.concat(propertyPath),
    );
    if (perAppValue !== undefined) {
      return perAppValue as T;
    }
  }
  let value = getValueOfPath(configuration, propertyPath);
  if (value === undefined) {
    value = defaultValue;
  }
  return value;
}

function getValueOfPath<T = any>(
  object: Record<string, any>,
  propertyPath: string,
): T {
  const fragments = propertyPath.split('.');

  let propertyValue = object;
  for (const fragment of fragments) {
    if (!propertyValue) {
      break;
    }
    propertyValue = propertyValue[fragment];
  }
  return propertyValue as T;
}
