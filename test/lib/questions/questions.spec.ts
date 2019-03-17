import { Question } from 'inquirer';
import { Input } from '../../../commands/command.input';
import {
  generateInput,
  generateSelect,
} from '../../../lib/questions/questions';

describe('Questions', () => {
  describe('generateInput', () => {
    it('should return an input question', () => {
      const input: Input = {
        name: 'name',
        value: 'test',
      };
      const message = 'name:';
      const question: Question = generateInput(input.name, message)('name');
      expect(question).toEqual({
        type: 'input',
        name: 'name',
        message,
        default: 'name',
      });
    });
  });
  describe('generateSelect', () => {
    it('should return a select question', () => {
      const choices: string[] = ['choiceA', 'choiceB', 'choiceC'];
      const question: Question = generateSelect('name')('message')(choices);
      expect(question).toEqual({
        type: 'list',
        name: 'name',
        message: 'message',
        choices,
      });
    });
  });
});
