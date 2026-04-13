import { describe, expect, it } from 'vitest';
import {
  FOUND_NO_ISSUES_GENERATING_METADATA,
  FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED,
  INITIALIZING_TYPE_CHECKER,
  SWC_LOG_PREFIX,
  TSC_LOG_ERROR_PREFIX,
  TSC_LOG_PREFIX,
  TSC_LOG_SUCCESS_PREFIX,
  TSC_NO_ERRORS_MESSAGE,
} from '../../../../lib/compiler/swc/constants.js';

describe('SWC/TSC Constants', () => {
  it('should define TSC_NO_ERRORS_MESSAGE for watch mode detection', () => {
    expect(TSC_NO_ERRORS_MESSAGE).toBe(
      'Found 0 errors. Watching for file changes.',
    );
  });

  it('should define all log prefix constants as non-empty strings', () => {
    expect(SWC_LOG_PREFIX).toBeDefined();
    expect(SWC_LOG_PREFIX.length).toBeGreaterThan(0);
    expect(TSC_LOG_PREFIX.length).toBeGreaterThan(0);
    expect(TSC_LOG_ERROR_PREFIX.length).toBeGreaterThan(0);
    expect(TSC_LOG_SUCCESS_PREFIX.length).toBeGreaterThan(0);
  });

  it('should define metadata generation messages', () => {
    expect(FOUND_NO_ISSUES_GENERATING_METADATA).toContain('metadata');
    expect(FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED).toContain('0 issues');
  });

  it('should define the initializing type checker message', () => {
    expect(INITIALIZING_TYPE_CHECKER).toContain('type checker');
  });
});
