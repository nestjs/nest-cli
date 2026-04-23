import { describe, it, expect } from 'vitest';
import {
  generateInput,
  generateSelect,
} from '../../../lib/questions/questions.js';

describe('Questions', () => {
  describe('generateInput', () => {
    it('should return an input question', () => {
      const input = {
        name: 'name',
        value: 'test',
      };
      const message = 'name:';
      const question = generateInput(input.name, message)('name');
      expect(question).toEqual({
        name: 'name',
        message,
        default: 'name',
      });
    });
  });
  describe('generateSelect', () => {
    it('should return a select question', () => {
      const choices: string[] = ['choiceA', 'choiceB', 'choiceC'];
      const question = generateSelect('name')('message')(choices);
      expect(question).toEqual({
        message: 'message',
        name: 'name',
        choices: [
          {
            name: 'choiceA',
            value: 'choiceA',
          },
          {
            name: 'choiceB',
            value: 'choiceB',
          },
          {
            name: 'choiceC',
            value: 'choiceC',
          },
        ],
      });
    });
  });
});
