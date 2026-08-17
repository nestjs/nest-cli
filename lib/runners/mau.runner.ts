import { AbstractRunner } from './abstract.runner.js';

/**
 * Runs the `mau` executable from `@nestjs/mau` through the current Node
 * binary, mirroring how the schematics CLI is invoked.
 */
export class MauRunner extends AbstractRunner {
  constructor(binaryPath: string) {
    super('node', [`"${binaryPath}"`]);
  }
}
