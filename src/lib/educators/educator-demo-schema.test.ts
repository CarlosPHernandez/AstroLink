import { describe, expect, it } from 'vitest';
import { EducatorDemoRequestSchema } from '@/lib/educators/educator-demo-schema';

const valid = {
  fullName: 'Alex Rivera',
  email: 'alex@school.edu',
  schoolName: 'Lincoln High STEM',
  role: 'Teacher' as const,
};

describe('EducatorDemoRequestSchema', () => {
  it('accepts a valid demo request', () => {
    const result = EducatorDemoRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alex@school.edu');
      expect(result.data.role).toBe('Teacher');
    }
  });

  it('normalizes email casing', () => {
    const result = EducatorDemoRequestSchema.safeParse({
      ...valid,
      email: 'Alex@School.EDU',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alex@school.edu');
    }
  });

  it('rejects honeypot when company is filled', () => {
    const result = EducatorDemoRequestSchema.safeParse({
      ...valid,
      company: 'Buy spam',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing school name', () => {
    const result = EducatorDemoRequestSchema.safeParse({
      ...valid,
      schoolName: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = EducatorDemoRequestSchema.safeParse({
      ...valid,
      role: 'Principal',
    });
    expect(result.success).toBe(false);
  });
});
