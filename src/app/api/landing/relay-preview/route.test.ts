import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertLandingGoalSubmission = vi.fn();
const listPublicMentors = vi.fn();
const generateLandingRelayTeaser = vi.fn();
const getSession = vi.fn();

vi.mock('@/lib/landing/persist-goal-submission', () => ({
  insertLandingGoalSubmission: (...args: unknown[]) => insertLandingGoalSubmission(...args),
}));

vi.mock('@/lib/mentor-directory', () => ({
  listPublicMentors: () => listPublicMentors(),
}));

vi.mock('@/lib/landing/hero-relay-llm', () => ({
  generateLandingRelayTeaser: (...args: unknown[]) => generateLandingRelayTeaser(...args),
  isLandingRelayLlmEnabled: () => true,
}));

vi.mock('@/lib/session', () => ({
  getSession: () => getSession(),
}));

import { POST } from './route';
import { __resetLandingRelayCacheForTests } from '@/lib/landing/relay-cache';
import { __resetLandingRelayRateLimitForTests } from '@/lib/landing/relay-rate-limit';

function expert(slug: string, name: string) {
  return {
    id: slug,
    slug,
    name,
    role: 'Expert',
    employer: 'NASA',
    rate: 250,
    category: 'systems' as const,
    expertise: ['systems'],
    bio: 'Bio',
    imageUrl: '/other.webp',
    introVideoUrl: null,
    availability: 'Book Session' as const,
    liveSessionPriceCents: 25000,
    stripeOnboardingCompleted: false,
  };
}

function makeRequest(body: unknown, ip = '203.0.113.10') {
  return new Request('http://localhost/api/landing/relay-preview', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      'user-agent': 'vitest',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/landing/relay-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetLandingRelayRateLimitForTests();
    __resetLandingRelayCacheForTests();
    vi.stubEnv('LANDING_RELAY_RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_MINUTE', '50');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_HOUR', '50');
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_DAY', '50');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_PER_IP_MINUTE', '50');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_PER_IP_HOUR', '50');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_PER_IP_DAY', '50');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_GLOBAL_HOUR', '50');
    vi.stubEnv('LANDING_RELAY_LLM_MAX_GLOBAL_DAY', '50');
    getSession.mockResolvedValue(null);
    listPublicMentors.mockResolvedValue([
      expert('chris-sembroski', 'Chris Sembroski'),
      expert('eiman-jahangir', 'Eiman Jahangir'),
    ]);
    insertLandingGoalSubmission.mockResolvedValue('sub-1');
    generateLandingRelayTeaser.mockResolvedValue({
      teaser: 'Specific answer about ion propulsion for your mission profile.',
      cta: 'View Eiman profile to book a live session.',
    });
  });

  it('persists goal and returns LLM teaser', async () => {
    const res = await POST(
      makeRequest({ goal: 'How do ion propulsion engines scale for deep space?' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('llm');
    expect(body.messages).toHaveLength(2);
    expect(body.messages[1].text).toMatch(/ion propulsion/i);
    expect(body.messages.filter((m: { role: string }) => m.role === 'expert')).toHaveLength(1);
    expect(insertLandingGoalSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        goalText: expect.stringContaining('ion propulsion'),
        replySource: 'llm',
      }),
    );
  });

  it('does not persist suggested path-chip goals', async () => {
    const res = await POST(
      makeRequest({
        goal: 'I am a student exploring a career in space. Where should I start?',
        suggested: true,
      }),
    );
    expect(res.status).toBe(200);
    expect(insertLandingGoalSubmission).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.submissionId).toBeNull();
  });

  it('does not persist known path-chip text even without suggested flag', async () => {
    const res = await POST(
      makeRequest({
        goal: 'I want to switch into aerospace. What paths actually work?',
      }),
    );
    expect(res.status).toBe(200);
    expect(insertLandingGoalSubmission).not.toHaveBeenCalled();
  });

  it('skips persist and LLM for honeypot', async () => {
    const res = await POST(
      makeRequest({ goal: 'Hello bots', website: 'http://spam.example' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(insertLandingGoalSubmission).not.toHaveBeenCalled();
    expect(generateLandingRelayTeaser).not.toHaveBeenCalled();
  });

  it('returns fallback without persist when submit rate limited', async () => {
    vi.stubEnv('LANDING_RELAY_MAX_REQUESTS_PER_IP_MINUTE', '1');
    __resetLandingRelayRateLimitForTests();

    await POST(makeRequest({ goal: 'First question about space careers' }));
    insertLandingGoalSubmission.mockClear();
    generateLandingRelayTeaser.mockClear();

    const res = await POST(makeRequest({ goal: 'Second question should be limited' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(insertLandingGoalSubmission).not.toHaveBeenCalled();
  });

  it('rejects empty goal', async () => {
    const res = await POST(makeRequest({ goal: '   ' }));
    expect(res.status).toBe(400);
  });
});
