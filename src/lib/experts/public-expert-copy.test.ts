import { describe, expect, it } from 'vitest';
import {
  filterExpertsByHomepageTopic,
  publicExpertCtaFirstName,
  publicExpertProof,
  publicExpertTitle,
} from './public-expert-copy';

describe('public expert copy', () => {
  it('replaces underselling live titles', () => {
    expect(publicExpertTitle('eiman-jahangir', 'Aerospace Expert')).toBe(
      'Cardiologist-astronaut · Blue Origin NS-26',
    );
    expect(publicExpertTitle('jenni-hesterman', 'Counter Intelligence')).toBe(
      'Col, USAF (ret) · analog astronaut',
    );
    expect(publicExpertTitle('unknown-slug', 'Fallback title')).toBe('Fallback title');
  });

  it('returns one proof line and Titan as the booking first name', () => {
    expect(publicExpertProof('chris-sembroski')).toBe('3 days in orbit on Inspiration4.');
    expect(publicExpertCtaFirstName('andrew-parris', 'Andrew Parris')).toBe('Titan');
  });

  it('filters homepage topic chips to inventory, not assessment', () => {
    const roster = [
      { slug: 'chris-sembroski' },
      { slug: 'eiman-jahangir' },
      { slug: 'priya-abiram' },
      { slug: 'andrew-parris' },
    ];
    expect(filterExpertsByHomepageTopic(roster, 'astronauts').map((e) => e.slug)).toEqual([
      'chris-sembroski',
      'eiman-jahangir',
    ]);
    expect(filterExpertsByHomepageTopic(roster, 'engineering').map((e) => e.slug)).toEqual([
      'chris-sembroski',
      'priya-abiram',
      'andrew-parris',
    ]);
    expect(filterExpertsByHomepageTopic(roster, 'careers')).toEqual(roster);
  });
});
