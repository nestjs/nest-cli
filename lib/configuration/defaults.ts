import { Configuration } from './configuration';

export const defaultConfiguration: Required<Configuration> = {
  language: 'ts',
  sourceRoot: 'src',
  collection: '@nestjs/schematics',
  entryFile: 'main',
  projects: {},
  monorepo: false,
  compilerOptions: {
    tsConfigPath: 'tsconfig.build.json',
    webpack: false,
    webpackConfigPath: 'webpack.config.js',
    plugins: [],
    assets: [],
  },
  generateOptions: {},
};

export const defaultOutDir = 'dist';
export const defaultGitIgnore = `# compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json`;
