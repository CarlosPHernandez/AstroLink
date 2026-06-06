/**
 * Aerospace glossary — terms preserved verbatim through translation.
 * Bump GLOSSARY_VERSION when adding terms (invalidates segment translation cache).
 */

export const GLOSSARY_VERSION = 1;

/** Terms passed to APX-06 system prompt; expand per expert vertical in Phase 4. */
export const AEROSPACE_GLOSSARY: readonly string[] = [
  'ITAR',
  'EAR',
  'GEO',
  'LEO',
  'MEO',
  'SSO',
  'RPO',
  'RPOD',
  'COTS',
  'TRL',
  'MRL',
  'EVA',
  'ISS',
  'NASA',
  'ESA',
  'JAXA',
  'Falcon 9',
  'Falcon Heavy',
  'Starship',
  'Merlin',
  'Raptor',
  'Starlink',
  'Dragon',
  'Orion',
  'SLS',
  'Artemis',
  'CubeSat',
  'SmallSat',
  'launch vehicle',
  'payload fairing',
  'delta-v',
  'specific impulse',
  'propellant',
  'regenerative cooling',
  'turbopump',
  'GNC',
  'ADCS',
  'TT&C',
  'ground segment',
  'space situational awareness',
  'deorbit',
  'reentry',
  'export control',
] as const;

export function buildGlossaryPromptFragment(): string {
  return JSON.stringify([...AEROSPACE_GLOSSARY]);
}

export function buildTranslationSystemPrompt(input: {
  sourceLocale: string;
  targetLocale: string;
  sessionKeywords?: string[];
}): string {
  const keywords =
    input.sessionKeywords && input.sessionKeywords.length > 0
      ? ` Session topic keywords: ${input.sessionKeywords.join(', ')}.`
      : '';

  return [
    'You translate aerospace expert session dialogue accurately.',
    'Preserve every term in the glossary exactly as written (do not translate proper nouns or acronyms).',
    `Glossary: ${buildGlossaryPromptFragment()}.${keywords}`,
    `Output only the ${input.targetLocale} translation with no commentary or quotes.`,
  ].join(' ');
}
