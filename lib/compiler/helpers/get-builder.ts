import {
  AVAILABLE_BUILDERS,
  Builder,
  BuilderVariant,
  Configuration,
} from '../../configuration/index.js';
import { getValueOrDefault } from './get-value-or-default.js';

function isValidBuilderVariant(value: unknown): value is BuilderVariant {
  return (
    typeof value === 'string' &&
    (AVAILABLE_BUILDERS as readonly string[]).includes(value)
  );
}

/**
 * Returns the validated builder configuration for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The normalized builder configuration object.
 */
export function getBuilder(
  configuration: Required<Configuration>,
  cmdOptions: Record<string, any>,
  appName: string | undefined,
): Exclude<Builder, string> {
  const builderValue = getValueOrDefault<unknown>(
    configuration,
    'compilerOptions.builder',
    appName,
    'builder',
    cmdOptions,
    'tsc',
  );

  const normalized =
    typeof builderValue === 'string'
      ? { type: builderValue }
      : typeof builderValue === 'object' &&
          builderValue !== null &&
          !Array.isArray(builderValue)
        ? (builderValue as Record<string, unknown>)
        : undefined;

  if (!normalized || !isValidBuilderVariant(normalized.type)) {
    const projectSuffix =
      appName !== undefined ? ` for project "${appName}"` : '';
    const detail =
      typeof builderValue === 'string'
        ? `"${builderValue}"`
        : JSON.stringify(builderValue);
    throw new Error(
      `Invalid builder ${detail}${projectSuffix}. Available builders: ${AVAILABLE_BUILDERS.join(', ')}.`,
    );
  }

  return normalized as Exclude<Builder, string>;
}
