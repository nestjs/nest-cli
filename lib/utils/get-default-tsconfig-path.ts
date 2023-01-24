import * as fs from 'fs';
import { join } from 'path';

const TSCONFIG_BUILD_JSON = 'tsconfig.build.json';
const TSCONFIG_JSON = 'tsconfig.json';

export function getDefaultTsconfigPath() {
  return fs.existsSync(join(process.cwd(), TSCONFIG_BUILD_JSON))
    ? TSCONFIG_BUILD_JSON
    : TSCONFIG_JSON;
}
