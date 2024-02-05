import { getDefaultTsconfigPath } from '../utils/get-default-tsconfig-path';
import { Configuration } from './configuration';

export const defaultConfiguration: Required<Configuration> = {
  language: 'ts',
  sourceRoot: 'src',
  collection: '@nestjs/schematics',
  entryFile: 'main',
  exec: 'node',
  projects: {},
  monorepo: false,
  compilerOptions: {
    builder: {
      type: 'tsc',
      options: {
        configPath: getDefaultTsconfigPath(),
      },
    },
    webpack: false,
    plugins: [],
    assets: [],
    manualRestart: false,
  },
  generateOptions: {},
};

export const defaultTsconfigFilename = getDefaultTsconfigPath();
export const defaultWebpackConfigFilename = 'webpack.config.js';
export const defaultOutDir = 'dist';
export const defaultGitIgnore = `# compiled output
/dist
/node_modules
/build

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
!.vscode/extensions.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# temp directory
.temp
.tmp

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json
`;
