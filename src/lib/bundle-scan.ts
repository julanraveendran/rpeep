/**
 * Looks for server secrets in what is sent to the browser (PRD section 13: "Add a test that searches the built client
 * bundle for the key name and fails if found"). Pure, so it can be tested; `scripts/check-bundle.ts` runs it on `.next/static`.
 */

export type ScannedFile = { path: string; content: string };
export type Leak = { path: string; kind: 'name' | 'value'; match: string };

/** A variable name on its own, not as part of a longer name such as NEXT_PUBLIC_SENTRY_DSN. */
function nameRegex(name: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9_])${name}(?![A-Za-z0-9_])`);
}

/**
 * @param names server-only variable names that must not appear
 * @param values their values, when known (for example from the build environment). Short values are ignored, because
 *   they would match by chance.
 */
export function findLeaks(files: readonly ScannedFile[], names: readonly string[], values: readonly string[] = []): Leak[] {
  const leaks: Leak[] = [];
  const patterns = names.map((name) => [name, nameRegex(name)] as const);
  const secrets = values.filter((value) => value.length >= 12);
  for (const file of files) {
    for (const [name, pattern] of patterns) if (pattern.test(file.content)) leaks.push({ path: file.path, kind: 'name', match: name });
    for (const value of secrets) if (file.content.includes(value)) leaks.push({ path: file.path, kind: 'value', match: `${value.slice(0, 4)}…` });
  }
  return leaks;
}
