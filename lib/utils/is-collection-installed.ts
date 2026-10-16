import { NodeWorkflow } from '@angular-devkit/schematics/tools/index.js';

/**
 * Whether the schematics `collection` resolves from the current project.
 */
export function isCollectionInstalled(collection: string): boolean {
  // Without `resolvePaths`, the workflow resolves collections relative to the
  // CLI's own install rather than the project.
  const workflow = new NodeWorkflow(process.cwd(), {
    resolvePaths: [process.cwd()],
  });
  try {
    workflow.engine.createCollection(collection);
    return true;
  } catch {
    return false;
  }
}
