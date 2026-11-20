import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeToKebabOrSnakeCase } from '../utils/formatting.js';
import { SchematicOption } from './schematic.option.js';

/** A question from a schematic's schema (`x-prompt`) that nobody answered. */
export interface SkippedPrompt {
  name: string;
  default?: unknown;
}

/**
 * The `x-prompt` questions of a schematic that the given options leave open,
 * each with the default the schematic falls back to when it can't ask.
 * Empty when the schematic's schema can't be read, so a collection the CLI
 * can't resolve still runs, just without the summary.
 */
export async function getSkippedPrompts(
  collection: string,
  schematic: string,
  options: SchematicOption[],
): Promise<SkippedPrompt[]> {
  try {
    const { NodeWorkflow } =
      await import('@angular-devkit/schematics/tools/index.js');
    // The project's own install first, then the one next to the CLI, the
    // same order the schematics binary resolves collections in.
    const workflow = new NodeWorkflow(process.cwd(), {
      resolvePaths: [process.cwd(), dirname(fileURLToPath(import.meta.url))],
    });
    const { schemaJson } = workflow.engine
      .createCollection(collection)
      .createSchematic(schematic).description;
    const properties = (schemaJson?.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const given = new Set(options.map((option) => option.normalizedName));
    return Object.entries(properties)
      .filter(
        ([name, property]) =>
          property['x-prompt'] !== undefined &&
          !given.has(normalizeToKebabOrSnakeCase(name)),
      )
      .map(([name, property]) => ({ name, default: property.default }));
  } catch {
    return [];
  }
}

/** How a skipped prompt was answered, as the flag that answers it the same. */
export function describeSkippedPrompt({
  name,
  default: value,
}: SkippedPrompt): string {
  const flag = `--${normalizeToKebabOrSnakeCase(name)}`;
  if (value === undefined) {
    return `${flag} (the schematic's own default)`;
  }
  if (typeof value === 'boolean') {
    return value ? flag : `--no-${normalizeToKebabOrSnakeCase(name)}`;
  }
  return `${flag} ${String(value)}`;
}
