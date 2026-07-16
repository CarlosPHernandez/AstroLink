import 'server-only';

import { PDFDocument, StandardFonts, type PDFFont, type PDFPage, rgb } from 'pdf-lib';
import { bookingDurationMinutes } from '@/lib/calendar-ics';
import { formatSessionWhenUtc } from '@/lib/email/booking-confirmed-templates';
import {
  isPreCallBrief,
  resolveExpertBrief,
} from '@/lib/briefing-display';
import {
  type AdminBookingExportContext,
  resolveBriefExportStatus,
  shouldWarnOps,
} from '@/lib/booking-export';
import { SERVICE_TYPE_LABELS } from '@/lib/types';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 48;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const COLOR_TITLE = rgb(0.1, 0.1, 0.12);
const COLOR_BODY = rgb(0.2, 0.2, 0.24);
const COLOR_MUTED = rgb(0.45, 0.45, 0.5);
const COLOR_WARN = rgb(0.72, 0.22, 0.18);

type PdfSection =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'warning'; text: string };

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

class PdfWriter {
  private pdf: PDFDocument;
  private page: PDFPage;
  private y: number;
  private readonly regular: PDFFont;
  private readonly bold: PDFFont;

  private constructor(
    pdf: PDFDocument,
    page: PDFPage,
    regular: PDFFont,
    bold: PDFFont,
  ) {
    this.pdf = pdf;
    this.page = page;
    this.regular = regular;
    this.bold = bold;
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  static async create(): Promise<PdfWriter> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    return new PdfWriter(pdf, page, regular, bold);
  }

  private ensureSpace(height: number) {
    if (this.y - height >= MARGIN_BOTTOM) {
      return;
    }
    this.page = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  drawTitle(text: string) {
    const size = 16;
    this.ensureSpace(size + 10);
    this.page.drawText(text, {
      x: MARGIN_X,
      y: this.y,
      size,
      font: this.bold,
      color: COLOR_TITLE,
    });
    this.y -= size + 10;
  }

  drawSubtitle(text: string) {
    const size = 10;
    const lines = wrapText(text, this.regular, size, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, {
        x: MARGIN_X,
        y: this.y,
        size,
        font: this.regular,
        color: COLOR_MUTED,
      });
      this.y -= size + 4;
    }
    this.y -= 4;
  }

  drawWarning(text: string) {
    const size = 9;
    const lines = wrapText(text, this.bold, size, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, {
        x: MARGIN_X,
        y: this.y,
        size,
        font: this.bold,
        color: COLOR_WARN,
      });
      this.y -= size + 4;
    }
    this.y -= 6;
  }

  drawSection(section: PdfSection) {
    if (section.kind === 'warning') {
      this.drawWarning(section.text);
      return;
    }

    if (section.kind === 'heading') {
      const size = 11;
      this.ensureSpace(size + 8);
      this.page.drawText(section.text.toUpperCase(), {
        x: MARGIN_X,
        y: this.y,
        size,
        font: this.bold,
        color: COLOR_TITLE,
      });
      this.y -= size + 6;
      return;
    }

    if (section.kind === 'paragraph') {
      const size = 9.5;
      const chunks = section.text.split('\n').map((part) => part.trim()).filter(Boolean);
      for (const chunk of chunks) {
        const lines = wrapText(chunk, this.regular, size, CONTENT_WIDTH);
        for (const line of lines) {
          this.ensureSpace(size + 3);
          this.page.drawText(line, {
            x: MARGIN_X,
            y: this.y,
            size,
            font: this.regular,
            color: COLOR_BODY,
          });
          this.y -= size + 3;
        }
      }
      this.y -= 6;
      return;
    }

    const size = 9.5;
    for (const item of section.items) {
      const prefix = '• ';
      const lines = wrapText(item, this.regular, size, CONTENT_WIDTH - 12);
      lines.forEach((line, index) => {
        this.ensureSpace(size + 3);
        const label = index === 0 ? prefix : '  ';
        this.page.drawText(`${label}${line}`, {
          x: MARGIN_X,
          y: this.y,
          size,
          font: this.regular,
          color: COLOR_BODY,
        });
        this.y -= size + 3;
      });
    }
    this.y -= 4;
  }

  drawFooter(text: string) {
    const size = 8;
    this.page.drawText(text, {
      x: MARGIN_X,
      y: MARGIN_BOTTOM - 12,
      size,
      font: this.regular,
      color: COLOR_MUTED,
    });
  }

  async toBytes(): Promise<Uint8Array> {
    return this.pdf.save();
  }
}

function warningMessage(ctx: AdminBookingExportContext): string | null {
  if (!shouldWarnOps(ctx.status)) {
    return null;
  }
  if (ctx.status === 'pending_payment' || ctx.status === 'payment_failed') {
    return 'Payment is not confirmed — verify before sharing this brief with the expert.';
  }
  if (ctx.status === 'cancelled' || ctx.status === 'refunded') {
    return `This session is ${ctx.status}. Do not share as an upcoming booking.`;
  }
  return 'Verify booking status before sharing this brief with the expert.';
}

export function buildExpertBriefPdfSections(
  ctx: AdminBookingExportContext,
  options?: { includeEmail?: boolean },
): PdfSection[] {
  const includeEmail = options?.includeEmail === true;
  const duration = ctx.duration_minutes ?? bookingDurationMinutes(ctx.service_type);
  const briefStatus = resolveBriefExportStatus(ctx);
  const sections: PdfSection[] = [];

  const warn = warningMessage(ctx);
  if (warn) {
    sections.push({ kind: 'warning', text: warn });
  }

  sections.push({
    kind: 'paragraph',
    text: [
      `Buyer: ${ctx.menteeName}`,
      includeEmail ? `Email: ${ctx.menteeEmail}` : null,
      `When: ${formatSessionWhenUtc(ctx.scheduled_at)} (${duration} min)`,
      `Service: ${SERVICE_TYPE_LABELS[ctx.service_type]}`,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  sections.push({ kind: 'heading', text: 'What they want help with' });
  sections.push({
    kind: 'paragraph',
    text: ctx.match_reason?.trim() || 'No goals submitted.',
  });

  sections.push({ kind: 'heading', text: 'Their background' });
  sections.push({
    kind: 'paragraph',
    text: ctx.intake_background?.trim() || 'No background submitted.',
  });

  sections.push({ kind: 'heading', text: 'How to prepare' });

  if (briefStatus.ready && ctx.briefing_json) {
    if (isPreCallBrief(ctx.briefing_json)) {
      sections.push({ kind: 'paragraph', text: ctx.briefing_json.one_line_summary });
      sections.push({ kind: 'paragraph', text: ctx.briefing_json.buyer_context_summary });
      if (ctx.briefing_json.focus_areas.length > 0) {
        sections.push({
          kind: 'bullets',
          items: ctx.briefing_json.focus_areas.map(
            (area) => `${area.topic}: ${area.suggested_angle}`,
          ),
        });
      }
    } else {
      const expert = resolveExpertBrief(ctx.briefing_json);
      if (expert) {
        if (expert.session_objectives.length > 0) {
          sections.push({
            kind: 'bullets',
            items: expert.session_objectives,
          });
        }
        sections.push({ kind: 'paragraph', text: expert.mentee_context_summary });
        if ('facilitation_notes' in expert && expert.facilitation_notes.length > 0) {
          sections.push({
            kind: 'bullets',
            items: expert.facilitation_notes,
          });
        }
      }
    }
  } else {
    sections.push({ kind: 'paragraph', text: briefStatus.message });
  }

  return sections;
}

export async function renderBookingBriefPdf(
  ctx: AdminBookingExportContext,
  options?: { includeEmail?: boolean },
): Promise<Uint8Array> {
  const writer = await PdfWriter.create();
  writer.drawTitle('AstroLink session prep');
  writer.drawSubtitle(`Prepared for ${ctx.mentorName}`);

  for (const section of buildExpertBriefPdfSections(ctx, options)) {
    writer.drawSection(section);
  }

  writer.drawFooter('AstroLink — confidential session prep');
  return writer.toBytes();
}

export function buildBookingExportPdfFilename(ctx: AdminBookingExportContext): string {
  const datePart = ctx.scheduled_at.slice(0, 10);
  const idPrefix = ctx.id.slice(0, 8);
  return `astrolink-session-prep-${idPrefix}-${datePart}.pdf`;
}