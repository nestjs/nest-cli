import { AbstractAction } from ".";
import { Input } from "../commands";
import * as fs from 'fs';

export class RemoveAction extends AbstractAction {
    public async handle(inputs: Input[]) {
        await removeFiles(inputs[0].value)
    }
}

const removeFiles = async (input: string | boolean | string[]) => {
  
  if (typeof(input) === "string") {
        fs.rm(`./src/${input}`, {recursive: true}, err => {
          if (err) {
            console.error('Error when removing the schematic:', err);
            return;
          } else {
            console.log(`Schematic Removed Successfully!`);
          }
        });
    }

}
