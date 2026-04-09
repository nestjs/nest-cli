import { normalizeToKebabOrSnakeCase } from '../../../lib/utils/formatting';

describe('normalizeToKebabOrSnakeCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(normalizeToKebabOrSnakeCase('myProject')).toBe('my-project');
  });

  it('should convert PascalCase to kebab-case', () => {
    expect(normalizeToKebabOrSnakeCase('MyProject')).toBe('my-project');
  });

  it('should replace spaces with dashes', () => {
    expect(normalizeToKebabOrSnakeCase('my project')).toBe('my-project');
  });

  it('should preserve underscores', () => {
    expect(normalizeToKebabOrSnakeCase('my_project')).toBe('my_project');
  });

  it('should keep already kebab-case strings unchanged', () => {
    expect(normalizeToKebabOrSnakeCase('my-project')).toBe('my-project');
  });

  it('should keep all-lowercase strings unchanged', () => {
    expect(normalizeToKebabOrSnakeCase('myproject')).toBe('myproject');
  });

  it('should handle numbers adjacent to uppercase letters', () => {
    expect(normalizeToKebabOrSnakeCase('myProject2Name')).toBe(
      'my-project2-name',
    );
  });

  it('should handle empty string', () => {
    expect(normalizeToKebabOrSnakeCase('')).toBe('');
  });

  it('should handle multiple spaces', () => {
    expect(normalizeToKebabOrSnakeCase('my new project')).toBe(
      'my-new-project',
    );
  });

  it('should handle mixed underscores and camelCase', () => {
    expect(normalizeToKebabOrSnakeCase('my_projectName')).toBe(
      'my_project-name',
    );
  });
});
