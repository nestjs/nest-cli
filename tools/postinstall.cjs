/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 1. Symlink test fixture ─────────────────────────────────────────────────
const link = path.join(__dirname, '..', 'node_modules', 'package');
if (!fs.existsSync(link)) {
  try {
    fs.symlinkSync(
      '../test/lib/schematics/fixtures/package',
      link,
      'dir',
    );
  } catch {
    // ignore – may fail in CI if node_modules is read-only
  }
}

// ── 2. Patch Vitest's bundled birpc RPC timeout ─────────────────────────────
// Vitest bundles birpc with a hard-coded 60 s DEFAULT_TIMEOUT for inter-process
// RPC calls.  Long-running e2e tests can exceed this limit, surfacing as:
//
//   Error: [vitest-worker]: Timeout calling "onTaskUpdate"
//
// Vitest exposes no configuration knob for this value, so we patch the bundled
// chunk directly.  The change is idempotent and survives re-installs because
// this script runs as a postinstall hook.
try {
  const chunksDir = path.join(
    __dirname,
    '..',
    'node_modules',
    'vitest',
    'dist',
    'chunks',
  );

  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    for (const file of files) {
      const filePath = path.join(chunksDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('const DEFAULT_TIMEOUT = 6e4')) {
        fs.writeFileSync(
          filePath,
          // 10 minutes – more than enough for any single RPC round-trip
          content.replace(
            'const DEFAULT_TIMEOUT = 6e4',
            'const DEFAULT_TIMEOUT = 6e5',
          ),
        );
        break;
      }
    }
  }
} catch {
  // non-critical – tests will still pass, just with a warning
}
