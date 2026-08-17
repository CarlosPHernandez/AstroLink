import { describe, expect, it } from 'vitest';
import { summarizeDirectoryReviewsForTest } from '@/lib/expert-reviews/directory-summaries';

describe('directory review summaries', () => {
  it('omits experts with no ratings', () => {
    expect(summarizeDirectoryReviewsForTest([])).toEqual({});
  });

  it('averages approved ratings and never invents a zero row', () => {
    expect(
      summarizeDirectoryReviewsForTest([
        { expert_id: 'a', rating: 5 },
        { expert_id: 'a', rating: 4 },
        { expert_id: 'b', rating: 0 },
      ]),
    ).toEqual({
      a: { average: 4.5, count: 2 },
    });
  });
});
