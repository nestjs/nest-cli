import { extname } from 'path';

export function isCompilableExtension(
  filename: string,
  allowedExtension: string[],
): boolean {
  const ext = extname(filename);
  return allowedExtension.includes(ext);
}
