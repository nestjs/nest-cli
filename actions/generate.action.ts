import { AbstractAction } from './abstract.action';

export class GenerateAction extends AbstractAction {
  public async handle(args: any, options: any, logger: any) {
    throw new Error("Method not implemented.");
  }
}
