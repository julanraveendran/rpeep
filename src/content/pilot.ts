/** Pilot page and form copy: PRD section 10. */

import { contact, site } from '@/content/site';

export const pilotPage = {
  title: 'Join the founding pilot',
  intro: `We're working with a small group of Responsible Persons to build ${site.name}. Pilot members get free setup for their first buildings, a founding price held for 12 months, and a direct say in what we build.`,
  nextHeading: 'What happens next',
  next: [
    'We review every application within 3 working days.',
    "If it's a good fit, we email you a short written walkthrough and pilot terms.",
    'No calls needed unless you want one.',
  ],
  submit: 'Apply for the pilot',
};

export const pilotQuestions = {
  currentMethods: 'How do you manage RPEEPs today?',
  currentSoftware: 'Which one?',
  hardestPart: 'What is the hardest part of RPEEPs for you?',
  topFeatures: 'Which features matter most?',
  topFeaturesHint: 'Choose up to 3.',
  wantsFraTracker: 'Would you also want help tracking fire risk assessment actions?',
  priceBand: 'What would you expect to pay per building per year for a tool that does this well?',
  startTiming: 'When would you want to start?',
} as const;

export const pilotThanks = {
  /** "Thanks, {first name}" */
  title: (firstName: string | null) => (firstName ? `Thanks, ${firstName}` : 'Thanks'),
  text: `We'll review your application and reply within 3 working days from ${contact.email}.`,
  backLink: 'Back to the free checker',
};

export const MAX_FEATURES = 3;
export const HARDEST_PART_MAX = 800;
