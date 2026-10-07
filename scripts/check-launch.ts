/**
 * Fails if the content still has a placeholder (`[BRAND]`, `[DOMAIN]`, company details, "to be confirmed" provider
 * regions). The deploy job runs this before every production deploy. Run it yourself: `npm run check:launch`.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { accessibility, cookies, privacy, terms } from '@/content/legal';
import { company, contact, founder, site } from '@/content/site';
import { allStrings, checkSiteUrl, collectLaunchEntries, findLaunchProblems } from '@/lib/launch-check';

const entries = collectLaunchEntries({
  site,
  founder,
  company,
  contact,
  legalDocuments: {
    privacy: allStrings(privacy),
    terms: allStrings(terms),
    cookies: allStrings(cookies),
    accessibility: allStrings(accessibility),
  },
});

const problems = findLaunchProblems(entries);
if (problems.length > 0) {
  console.error(`Not ready to launch: ${problems.length} placeholder(s) or empty value(s) in src/content/:`);
  for (const problem of problems) console.error(`  ${problem.where}: ${problem.value}`);
  console.error('\nReplace them in src/content/site.ts and src/content/legal.ts (see README: "Before launch").');
  process.exit(1);
}

// The live address (the SITE_URL variable in CI) must match the domain in site.ts. Skipped when it is not set.
const siteUrl = process.env.SITE_URL;
if (siteUrl !== undefined) {
  const addressProblems = checkSiteUrl(siteUrl, site.domain);
  if (addressProblems.length > 0) {
    console.error('Not ready to launch:');
    for (const problem of addressProblems) console.error(`  ${problem}`);
    process.exit(1);
  }
}

console.log(`Launch check passed: none of the ${Object.keys(entries).length} launch values is a placeholder.`);

// A reminder, not a failure: the checks above cannot tell whether you have signed off the regulatory wording.
function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) yield full;
  }
}
const marker = 'TODO(' + 'founder)';
const reminders: string[] = [];
for (const file of sourceFiles('src')) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (line.includes(marker)) reminders.push(`  ${file}:${index + 1}`);
    });
}
if (reminders.length > 0) {
  console.log(`\n${reminders.length} ${marker} marker(s) remain. A green launch check does not mean they are done:`);
  for (const reminder of reminders) console.log(reminder);
}
