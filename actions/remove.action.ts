import { AbstractAction } from '.';
import { Input } from '../commands';
import * as fs from 'fs';
import { red, green } from 'ansis';

export class RemoveAction extends AbstractAction {
  public async handle(inputs: Input[]) {
    await removeFiles(inputs[0].value);
  }
}

const removeFiles = async (input: string | boolean | string[]) => {
  if (typeof input === 'string') {
    fs.rm(`./src/${input}`, { recursive: true }, (err) => {
      if (err) {
        console.error(red('Error'), 'when removing the element:', err);
        return;
      } else {
        console.log(green('Element'), 'Removed Successfully!');
      }
    });
  }
};
