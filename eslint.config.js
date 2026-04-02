import { defineConfig, globalIgnores } from 'eslint/config';

import globals from 'globals';

import js from '@eslint/js';
import ts from 'typescript-eslint';

import prettier from 'eslint-plugin-prettier';
import jest from 'eslint-plugin-jest';

export default defineConfig([
  globalIgnores(['node_modules', 'coverage', 'dist']),
  js.configs.recommended,
  ts.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      ...prettier.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    ...jest.configs['flat/recommended'],
  },
]);
