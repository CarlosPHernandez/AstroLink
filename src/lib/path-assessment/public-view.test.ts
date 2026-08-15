import { describe, expect, it } from 'vitest';
import { mapPathAssessmentPublicView } from './public-view';

const answers = {
  firstName: 'Ada',
  email: 'ada@example.com',
  stage: 'Student',
  primaryGoal: 'I want to work on propulsion systems.',
  experience: 'Junior mechanical engineer looking at aerospace.',
  network: 'None',
  obstacle: 'I do not know anyone in the industry.',
};

describe('mapPathAssessmentPublicView', () => {
  it('flags fallback reports when llm_error is set', () => {
    const view = mapPathAssessmentPublicView({
      public_token: 'a'.repeat(64),
      status: 'ready',
      first_name: 'Ada',
      answers_json: answers,
      report_json: null,
      report_html: null,
      created_at: '2026-08-15T00:00:00.000Z',
      llm_error: 'llm_fallback',
      match_reason: null,
      mentors: null,
    });
    expect(view?.usedFallback).toBe(true);
    expect(view?.recommendedMentor).toBeNull();
  });

  it('includes a recommended mentor only when match reason exists', () => {
    const view = mapPathAssessmentPublicView({
      public_token: 'b'.repeat(64),
      status: 'ready',
      first_name: 'Ada',
      answers_json: answers,
      report_json: null,
      report_html: null,
      created_at: '2026-08-15T00:00:00.000Z',
      llm_error: null,
      match_reason: 'Propulsion background matches Chris.',
      mentors: {
        id: 'mentor-1',
        slug: 'chris-sembroski',
        full_name: 'Chris Sembroski',
      },
    });
    expect(view?.usedFallback).toBe(false);
    expect(view?.recommendedMentor).toEqual({
      id: 'mentor-1',
      slug: 'chris-sembroski',
      fullName: 'Chris Sembroski',
      matchReason: 'Propulsion background matches Chris.',
    });
  });
});
