import 'server-only';

export const NF1860_MAX_BYTES = 10 * 1024 * 1024;

const PDF_MAGIC = '%PDF-';

export type Nf1860ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateNf1860PdfBuffer(buffer: Buffer): Nf1860ValidationResult {
  if (buffer.length === 0) {
    return { ok: false, message: 'Choose a PDF to upload.' };
  }

  if (buffer.length > NF1860_MAX_BYTES) {
    return { ok: false, message: 'PDF must be 10 MB or smaller.' };
  }

  if (!buffer.subarray(0, PDF_MAGIC.length).toString('utf8').startsWith(PDF_MAGIC)) {
    return { ok: false, message: 'Upload a PDF scan of your approved NF-1860 form.' };
  }

  return { ok: true };
}

export function validateNf1860PdfFile(file: File): Nf1860ValidationResult {
  if (file.size === 0) {
    return { ok: false, message: 'Choose a PDF to upload.' };
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, message: 'Upload a PDF scan of your approved NF-1860 form.' };
  }

  if (file.size > NF1860_MAX_BYTES) {
    return { ok: false, message: 'PDF must be 10 MB or smaller.' };
  }

  return { ok: true };
}