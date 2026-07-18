import { describe, expect, it } from 'vitest';

import {
  buildDefaultBlocks,
  findSlotByStartUtc,
  generateSlotsForBlock,
  generateSlotsForBlocks,
  wallTimeInTimeZoneToUtc,
  type ChrisAvailabilityBlock,
} from '@/lib/chris-campaign/chris-availability-slots';

describe('chris-availability-slots', () => {
  it('converts PDT noon wall time to 19:00 UTC in July', () => {
    // 2026-07-21 is a Tuesday; Pacific is PDT (UTC-7)
    const utc = wallTimeInTimeZoneToUtc('2026-07-21', 12, 0);
    expect(utc.toISOString()).toBe('2026-07-21T19:00:00.000Z');
  });

  it('generates five 45-min starts for Tue 12:00–4:00 PDT', () => {
    const block: ChrisAvailabilityBlock = {
      dayKey: 'tue',
      isoDate: '2026-07-21',
      startHour: 12,
      startMinute: 0,
      endHour: 16,
      endMinute: 0,
    };
    const slots = generateSlotsForBlock(block);
    expect(slots).toHaveLength(5);
    // 12:00, 12:45, 1:30, 2:15, 3:00 PDT → last ends 3:45 ≤ 4:00
    expect(slots[0]?.startUtcIso).toBe('2026-07-21T19:00:00.000Z');
    expect(slots[0]?.endUtcIso).toBe('2026-07-21T19:45:00.000Z');
    expect(slots[4]?.startUtcIso).toBe(
      wallTimeInTimeZoneToUtc('2026-07-21', 15, 0).toISOString(),
    );
    expect(slots[4]?.endUtcIso).toBe(
      wallTimeInTimeZoneToUtc('2026-07-21', 15, 45).toISOString(),
    );
    // No start that would end after 4:00
    for (const slot of slots) {
      expect(new Date(slot.endUtcIso).getTime()).toBeLessThanOrEqual(
        wallTimeInTimeZoneToUtc('2026-07-21', 16, 0).getTime(),
      );
    }
  });

  it('ends Thu 1–9p with last start 7:45p (10 slots; 8:15 would end after 9p)', () => {
    const block: ChrisAvailabilityBlock = {
      dayKey: 'thu',
      isoDate: '2026-07-23',
      startHour: 13,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    };
    const slots = generateSlotsForBlock(block);
    // 8h / 45m = 10 full sessions; last start 7:45p → ends 8:30p ≤ 9p
    expect(slots).toHaveLength(10);
    expect(slots[0]?.startUtcIso).toBe(
      wallTimeInTimeZoneToUtc('2026-07-23', 13, 0).toISOString(),
    );
    expect(slots.at(-1)?.startUtcIso).toBe(
      wallTimeInTimeZoneToUtc('2026-07-23', 19, 45).toISOString(),
    );
  });

  it('ends Fri 12–9p with last start 8:15p and 12 slots', () => {
    const block: ChrisAvailabilityBlock = {
      dayKey: 'fri',
      isoDate: '2026-07-24',
      startHour: 12,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    };
    const slots = generateSlotsForBlock(block);
    expect(slots).toHaveLength(12);
    expect(slots.at(-1)?.startUtcIso).toBe(
      wallTimeInTimeZoneToUtc('2026-07-24', 20, 15).toISOString(),
    );
  });

  it('builds default blocks and finds a slot by start UTC', () => {
    const blocks = buildDefaultBlocks({
      tue: '2026-07-21',
      thu: '2026-07-23',
      fri: '2026-07-24',
    });
    const slots = generateSlotsForBlocks(blocks);
    expect(slots.length).toBe(5 + 10 + 12);
    const first = slots[0]!;
    expect(findSlotByStartUtc(slots, first.startUtcIso)?.label).toBe(first.label);
    expect(findSlotByStartUtc(slots, 'not-a-date')).toBeUndefined();
  });

  it('includes readable labels with time range', () => {
    const slots = generateSlotsForBlock({
      dayKey: 'tue',
      isoDate: '2026-07-21',
      startHour: 12,
      startMinute: 0,
      endHour: 16,
      endMinute: 0,
    });
    expect(slots[0]?.timeRangeLabel).toMatch(/12:00/i);
    expect(slots[0]?.label).toMatch(/Jul/);
    expect(slots[0]?.label).toMatch(/PDT|PST|GMT-7|GMT-8/i);
  });
});
