/**
 * Fails if the content still has a placeholder (`[BRAND]`, `[DOMAIN]`, company details, "to be confirmed" provider
 * regions). The deploy job runs this before every production deploy. Run it yourself: `npm run check:launch`.
 */

import { accessibility, cookies, privacy, terms } from '@/content/legal';
import { company, contact, founder, site } from '@/content/site';
import { allStrings, collectLaunchEntries, findPlaceholders } from '@/lib/launch-check';

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

const problems = findPlaceholders(entries);
if (problems.length > 0) {
  console.error(`Not ready to launch: ${problems.length} placeholder(s) left in src/content/:`);
  for (const problem of problems) console.error(`  ${problem.where}: ${problem.value}`);
  console.error('\nReplace them in src/content/site.ts and src/content/legal.ts (see README: "Before launch").');
  process.exit(1);
}
console.log(`Launch check passed: none of the ${Object.keys(entries).length} launch values is a placeholder.`);
