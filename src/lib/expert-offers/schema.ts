import { z } from 'zod';
import {
  OFFER_DESCRIPTION_MAX,
  OFFER_DESCRIPTION_MIN,
  OFFER_DURATIONS,
  OFFER_PRICE_MAX_CENTS,
  OFFER_PRICE_MIN_CENTS,
  OFFER_TITLE_MAX,
  OFFER_TITLE_MIN,
} from '@/lib/expert-offers/constants';

export const OfferWriteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(OFFER_TITLE_MIN, { message: `Title must be at least ${OFFER_TITLE_MIN} characters.` })
    .max(OFFER_TITLE_MAX, { message: `Title must be at most ${OFFER_TITLE_MAX} characters.` }),
  description: z
    .string()
    .trim()
    .min(OFFER_DESCRIPTION_MIN, {
      message: `Description must be at least ${OFFER_DESCRIPTION_MIN} characters.`,
    })
    .max(OFFER_DESCRIPTION_MAX, {
      message: `Description must be at most ${OFFER_DESCRIPTION_MAX} characters.`,
    }),
  duration_minutes: z
    .number()
    .int()
    .refine((n) => (OFFER_DURATIONS as readonly number[]).includes(n), {
      message: 'Duration must be 15, 30, 45, or 60 minutes.',
    }),
  price_cents: z
    .number()
    .int()
    .min(OFFER_PRICE_MIN_CENTS, { message: 'Price must be at least $10.' })
    .max(OFFER_PRICE_MAX_CENTS, { message: 'Price must be at most $500.' }),
});

export const OfferPatchSchema = OfferWriteSchema.partial();
