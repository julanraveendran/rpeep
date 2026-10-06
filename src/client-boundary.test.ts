import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Server-only code must never reach the browser bundle (PRD section 4, rule 5). This follows every import from every
 * file that starts with 'use client' and fails if it reaches a server-only module or package.
 */

const SRC = path.join(process.cwd(), 'src');

const SERVER_ONLY = [
  /^@\/lib\/(supabase|db|env|ratelimit|tokens|turnstile|ip|api\/|email\/|pdf\/)/,
  /^@\/sentry\.server$/,
  /^@supabase\//,
  /^@upstash\//,
  /^@react-pdf\//,
  /^resend$/,
  /^node:/,
  /^(fs|path|crypto|child_process)$/,
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(SRC).filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file));
const source = new Map(files.map((file) => [file, readFileSync(file, 'utf8')]));

function importsOf(code: string): string[] {
  const found: string[] = [];
  for (const match of code.matchAll(/(?:^|\n)\s*(import|export)\s+(type\s+)?[^;'"]*?from\s+['"]([^'"]+)['"]/g)) {
    if (!match[2]) found.push(match[3]!); // `import type` is erased at build time
  }
  for (const match of code.matchAll(/(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g)) found.push(match[1]!);
  for (const match of code.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) found.push(match[1]!);
  return found;
}

function resolve(from: string, specifier: string): string | null {
  const base = specifier.startsWith('@/') ? path.join(SRC, specifier.slice(2)) : specifier.startsWith('.') ? path.resolve(path.dirname(from), specifier) : null;
  if (!base) return null;
  return [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find((candidate) => source.has(candidate)) ?? null;
}

const isClient = (code: string) => /^(\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*['"]use client['"]/.test(code);
const clientRoots = files.filter((file) => isClient(source.get(file)!));

describe('client bundle boundary', () => {
  it('finds the client components', () => {
    expect(clientRoots.length).toBeGreaterThan(15);
    expect(clientRoots.map((file) => path.relative(SRC, file))).toEqual(expect.arrayContaining(['components/checker/Checker.tsx', 'components/forms/ReportForm.tsx', 'components/forms/PilotForm.tsx']));
  });

  it('never reaches server-only code from a client component, directly or through other modules', () => {
    const problems: string[] = [];
    for (const root of clientRoots) {
      const seen = new Set<string>();
      const visit = (file: string, chain: string[]) => {
        if (seen.has(file)) return;
        seen.add(file);
        for (const specifier of importsOf(source.get(file)!)) {
          if (SERVER_ONLY.some((pattern) => pattern.test(specifier))) {
            problems.push(`${[...chain, file].map((f) => path.relative(SRC, f)).join(' → ')} imports ${specifier}`);
            continue;
          }
          const next = resolve(file, specifier);
          if (next) visit(next, [...chain, file]);
        }
      };
      visit(root, []);
    }
    expect(problems).toEqual([]);
  });

  it('no NEXT_PUBLIC_ variable has a secret-looking name', () => {
    const example = readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    const publicNames = [...example.matchAll(/^#?\s*(NEXT_PUBLIC_[A-Z0-9_]+)=/gm)].map((match) => match[1]!);
    expect(publicNames.length).toBeGreaterThan(0);
    for (const name of publicNames) expect(name, name).not.toMatch(/SECRET|SERVICE_ROLE|TOKEN|PASSWORD|PRIVATE|SALT|API_KEY/);
  });

  it('keeps server-only modules out of the files that start with "use client" by name', () => {
    for (const file of clientRoots) expect(path.relative(SRC, file)).not.toMatch(/^lib\/(supabase|db|env|ratelimit|tokens|turnstile|api|email|pdf)/);
  });
});
