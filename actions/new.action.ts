import { AbstractAction } from "./abstract.action";

export class NewAction extends AbstractAction {
  public async handle(args: any, options: any, logger: any) {
    throw new Error("Method not implemented.");
  }
}
