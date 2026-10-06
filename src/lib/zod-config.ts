import { z } from 'zod';

/**
 * Zod normally probes for `new Function` to compile faster validators. Under our Content-Security-Policy (no
 * `unsafe-eval`) that probe is blocked and reported as a violation, even though Zod copes. Turning the compiler off
 * skips the probe. Validation is the same, just not pre-compiled, which is irrelevant at this size.
 */
z.config({ jitless: true });
