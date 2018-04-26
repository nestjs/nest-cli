import { AbstractCommand } from "./abstract.command";
import { AbstractAction } from "../actions";

export class GenerateCommand extends AbstractCommand {
  public load(program: any) {
    throw new Error("Method not implemented.");
  }
}
