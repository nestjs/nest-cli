import { Input } from '../../../commands/command.input';
import { Question } from 'inquirer';
import { generateInput, generateSelect } from '../../../lib/questions/questions';

describe('Questions', () => {
  describe('generateInput', () => {
    it('should return an input question when Input value is undefined', () => {
      const input: Input = {
        name: 'name',
        value: undefined
      };
      const question: Question = generateInput(input.name)(input.value)('name');
      expect(question).toEqual({
        type: 'input',
        name: 'name',
        message: 'name :',
        default: 'name'
      });
    });
    it('should return undefined when Input value is defined', () => {
      const input: Input = {
        name: 'name',
        value: 'name'
      };
      const question = generateInput(input.name)(input.value);
      expect(question).toBeUndefined();
    });
  });
  describe('generateSelect', () => {
    it('should return a select question', () => {
      const choices: string[] = [ 'choiceA', 'choiceB', 'choiceC' ];
      const question: Question = generateSelect('name')('message')(choices);
      expect(question).toEqual({
        type: 'list',
        name: 'name',
        message: 'message',
        choices: choices
      });
    });
  });
});
