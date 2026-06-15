import type { ZodError } from 'zod';

export type FieldErrors = Record<string, string[]>;

export function toFieldErrors(error: ZodError): FieldErrors {
  return error.flatten().fieldErrors;
}

export function firstFieldError(
  errors: FieldErrors | undefined,
  field: string,
): string | undefined {
  return errors?.[field]?.[0];
}

export function formLevelSummary(): string {
  return 'Check the highlighted fields.';
}

export function fieldErrorInputClass(hasError: boolean, baseClass: string): string {
  return hasError ? `${baseClass} border-error/50` : baseClass;
}