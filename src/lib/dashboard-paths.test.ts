import { describe, expect, it } from 'vitest';
import {
  getDashboardPathForRole,
  getMentorPrepDashboardPath,
  getPostBookingDashboardPath,
} from './dashboard-paths';

describe('getDashboardPathForRole', () => {
  it('routes each role to its dashboard', () => {
    expect(getDashboardPathForRole('mentee')).toBe('/dashboard/mentee');
    expect(getDashboardPathForRole('mentor')).toBe('/dashboard/mentor');
    expect(getDashboardPathForRole('admin')).toBe('/dashboard/admin');
  });
});

describe('getPostBookingDashboardPath', () => {
  it('appends booked query for mentees only', () => {
    expect(getPostBookingDashboardPath('mentee', 'bk-123')).toBe(
      '/dashboard/mentee?booked=bk-123',
    );
    expect(getPostBookingDashboardPath('mentor', 'bk-123')).toBe('/dashboard/mentor');
    expect(getPostBookingDashboardPath('admin', 'bk-123')).toBe('/dashboard/admin');
  });
});

describe('getMentorPrepDashboardPath', () => {
  it('appends prep query for mentor dashboard', () => {
    expect(getMentorPrepDashboardPath('bk-123')).toBe('/dashboard/mentor?prep=bk-123');
  });
});