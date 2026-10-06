/**
 * Landing page copy: PRD section 6. Final draft copy lives here so it can be edited without
 * touching components. Regulatory wording comes from `regulations.ts`, never from here.
 */

import type { DutyId } from '@/content/regulations';
import { founder, regulationsInForce, site } from '@/content/site';

export const hero = {
  eyebrow: 'For Responsible Persons in England',
  title: 'Residential PEEPs, handled properly.',
  subheading: `Since ${regulationsInForce}, Responsible Persons for many residential buildings must identify residents who may need help to evacuate, offer person-centred fire risk assessments and share key information with the fire service. ${site.name} will help you do it, and evidence that you did.`,
  primaryCta: 'Check if your building is in scope (2 min)',
  secondaryCta: 'Join the pilot',
  trustLine: 'Free · No account needed · Data hosted in the UK · Built by a fire safety professional',
};

export const law = {
  title: 'What the Residential Evacuation Plans Regulations require',
  intro: `The Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 came into force on ${regulationsInForce}.`,
  linkLabel: 'Read the regulations',
};

export type LawCard = { dutyId: DutyId; title: string; badge: string };

/** The six cards in the grid. Plain English and legal detail come from the duty with the same id. */
export const lawCards: readonly LawCard[] = [
  { dutyId: 'D1', title: 'Identify residents', badge: 'Reg 5' },
  { dutyId: 'D2', title: 'Offer a person-centred fire risk assessment', badge: 'Reg 6' },
  { dutyId: 'D3', title: 'Put reasonable measures in place', badge: 'Reg 7' },
  { dutyId: 'D4', title: 'Agree and record an emergency evacuation statement', badge: 'Reg 8' },
  { dutyId: 'D5', title: 'Review every 12 months', badge: 'Reg 9' },
  { dutyId: 'D6', title: 'Share information with the fire service, with consent', badge: 'Reg 10' },
];

/** The wide card below the grid. */
export const lawWideCard: LawCard = { dutyId: 'D8', title: 'Building emergency evacuation plan', badge: 'Reg 13' };

export const whyHard = {
  title: 'Why this is hard to manage today',
  items: [
    {
      icon: 'search',
      title: 'Finding residents who need help.',
      text: 'Residents rarely tell landlords, and you must use reasonable endeavours to identify them.',
    },
    {
      icon: 'consent',
      title: 'Consent at every step.',
      text: "Information can only go to the fire service with a resident's explicit consent.",
    },
    {
      icon: 'calendar',
      title: 'Deadlines that never stop.',
      text: 'Assessments, statements and building plans all need reviewing at least every 12 months.',
    },
  ],
} as const;

export const how = {
  title: `How ${site.name} will work`,
  label: 'In development — pilot opening soon',
  steps: [
    { title: 'Set up your building' },
    { title: 'Find residents', detail: 'letters, posters, QR code' },
    { title: 'Record consent' },
    { title: 'Carry out the person-centred assessment' },
    { title: 'Agree the emergency evacuation statement' },
    { title: 'Share with the fire service' },
    { title: 'Automatic review reminders' },
  ],
} as const;

export const freeTool = {
  title: 'Is your building in scope?',
  text: 'Answer up to six questions about your building. Get an instant answer, the duties that apply, and a free PDF report.',
  cta: 'Start the free checker',
  smallPrint: 'England only. Guidance, not legal advice.',
};

export const pilot = {
  title: 'Join the founding pilot',
  // Do not state a price (PRD section 6, item 7).
  benefits: ['Free setup for your first buildings', 'Founding price held for 12 months', 'Shape the product with your feedback'],
  cta: 'Apply for the pilot',
};

export const whyBuilding = {
  title: "Why we're building this",
  // TODO(founder): edit this text. Do not name an employer (PRD section 2, hard rules).
  text: `The Grenfell Tower Inquiry recommended personal emergency evacuation plans for residents who need help to escape. These regulations are the result. I work in fire safety, writing fire strategy reports for residential and mixed-use buildings, and I'm building ${site.name} to make the process simple, consistent and properly recorded.`,
  signature: `${founder.firstName}, ${founder.role}`,
};

export const data = {
  title: 'How we handle data',
  bullets: [
    'The free checker asks about the building, not about residents.',
    'Report requests are stored in a UK data centre and deleted after 24 months.',
    'We never sell or share your details.',
    'Unsubscribe in one click.',
  ],
  linkLabel: 'Read our privacy notice',
};
