import { bgCyan, bgGreen, bgRed, cyan, green, red } from 'ansis';

export const TSC_NO_ERRORS_MESSAGE =
  'Found 0 errors. Watching for file changes.';

export const TSC_COMPILATION_STARTED_MESSAGE =
  'Starting compilation in watch mode...';

export const SWC_LOG_PREFIX = cyan('> ') + bgCyan.bold(' SWC ');

export const TSC_LOG_PREFIX = cyan('> ') + bgCyan.bold(' TSC ');
export const TSC_LOG_ERROR_PREFIX = red('> ') + bgRed.bold(' TSC ');
export const TSC_LOG_SUCCESS_PREFIX = green('> ') + bgGreen.bold(' TSC ');

export const INITIALIZING_TYPE_CHECKER =
  bgCyan.bold(' TSC ') + cyan(' Initializing type checker...');

export const FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED =
  TSC_LOG_SUCCESS_PREFIX + green(' Found 0 issues.');

export const FOUND_NO_ISSUES_GENERATING_METADATA =
  TSC_LOG_SUCCESS_PREFIX + green(' Found 0 issues. Generating metadata...');
