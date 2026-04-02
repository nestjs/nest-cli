import { defineConfig } from 'jest'

export default defineConfig({
  coverageProvider: 'v8',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': '@swc/jest'
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  modulePaths: ['<rootDir>/test/lib/schematics/fixtures']
})