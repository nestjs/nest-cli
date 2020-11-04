import * as deleteEmpty from 'delete-empty';
import { series, src, task } from 'gulp';
import * as clean from 'gulp-clean';
import { sources } from '../config';

/**
 * Cleans the build output assets from the packages folders
 */
function cleanOutput() {
  const files = sources.map((source) => [
    `${source}/**/*.js`,
    `${source}/**/*.d.ts`,
    `${source}/**/*.js.map`,
    `${source}/**/*.d.ts.map`,
  ]);
  return src(
    files.reduce((a, b) => a.concat(b), []),
    {
      read: false,
    },
  ).pipe(clean());
}

/**
 * Cleans empty dirs
 */
function cleanDirs(done: () => void) {
  sources.forEach((source) => deleteEmpty.sync(`${source}/`));
  done();
}

task('clean:output', cleanOutput);
task('clean:dirs', cleanDirs);
task('clean:bundle', series('clean:output', 'clean:dirs'));
