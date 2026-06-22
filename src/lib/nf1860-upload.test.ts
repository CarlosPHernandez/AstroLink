import { describe, expect, it } from 'vitest';
import {
  NF1860_MAX_BYTES,
  validateNf1860PdfBuffer,
  validateNf1860PdfFile,
} from '@/lib/nf1860-upload';

const MINIMAL_PDF = Buffer.from('%PDF-1.0\n%%EOF\n');

describe('validateNf1860PdfBuffer', () => {
  it('accepts a minimal valid PDF', () => {
    expect(validateNf1860PdfBuffer(MINIMAL_PDF)).toEqual({ ok: true });
  });

  it('rejects empty buffer', () => {
    expect(validateNf1860PdfBuffer(Buffer.alloc(0))).toEqual({
      ok: false,
      message: 'Choose a PDF to upload.',
    });
  });

  it('rejects wrong magic bytes', () => {
    expect(validateNf1860PdfBuffer(Buffer.from('not a pdf'))).toEqual({
      ok: false,
      message: 'Upload a PDF scan of your approved NF-1860 form.',
    });
  });

  it('rejects oversized buffer', () => {
    const oversized = Buffer.alloc(NF1860_MAX_BYTES + 1, 0);
    oversized.write('%PDF-1.0', 0);
    expect(validateNf1860PdfBuffer(oversized)).toEqual({
      ok: false,
      message: 'PDF must be 10 MB or smaller.',
    });
  });
});

describe('validateNf1860PdfFile', () => {
  it('accepts a .pdf file within size limit', () => {
    const file = new File([MINIMAL_PDF], 'nf1860.pdf', { type: 'application/pdf' });
    expect(validateNf1860PdfFile(file)).toEqual({ ok: true });
  });

  it('rejects non-pdf extension', () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    expect(validateNf1860PdfFile(file)).toEqual({
      ok: false,
      message: 'Upload a PDF scan of your approved NF-1860 form.',
    });
  });
});