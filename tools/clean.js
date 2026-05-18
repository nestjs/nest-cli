import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const sources = ['lib', 'actions', 'commands', 'bin'];
const extensions = ['.js', '.d.ts', '.js.map', '.d.ts.map'];

function matchesExtension(file) {
  return extensions.some((ext) => file.endsWith(ext));
}

async function cleanFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await cleanFiles(fullPath);
    } else if (matchesExtension(entry.name)) {
      await rm(fullPath);
    }
  }
}

async function removeEmptyDirs(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = join(dir, entry.name);
      await removeEmptyDirs(fullPath);
      const remaining = await readdir(fullPath);
      if (remaining.length === 0) {
        await rm(fullPath, { recursive: true });
      }
    }
  }
}

for (const source of sources) {
  await cleanFiles(source);
  await removeEmptyDirs(source);
}
