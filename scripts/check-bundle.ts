/**
 * Fails if a server secret appears in the built client bundle. Run after `npm run build`: `npm run check:bundle`.
 * Looks in `.next/static`, which is everything the browser downloads from the build.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { findLeaks, type ScannedFile } from '@/lib/bundle-scan';
import { serverEnvSchema } from '@/lib/env';

const root = path.join(process.cwd(), '.next', 'static');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

let paths: string[];
try {
  paths = walk(root);
} catch {
  console.error(`No build found at ${root}. Run \`npm run build\` first.`);
  process.exit(2);
}

const files: ScannedFile[] = paths
  .filter((file) => /\.(js|css|json|map|html|txt)$/.test(file))
  .map((file) => ({ path: path.relative(process.cwd(), file), content: readFileSync(file, 'utf8') }));

const names = Object.keys(serverEnvSchema.shape);
// Also look for the real values, if the build environment has them.
const values = names.map((name) => process.env[name]).filter((value): value is string => Boolean(value));

const leaks = findLeaks(files, names, values);
if (leaks.length > 0) {
  console.error(`Found ${leaks.length} server secret(s) in the client bundle:`);
  for (const leak of leaks) console.error(`  ${leak.path}: ${leak.kind} ${leak.match}`);
  process.exit(1);
}
console.log(`Checked ${files.length} client files for ${names.length} server variable names and ${values.length} secret values: none found.`);
