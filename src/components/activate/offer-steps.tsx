'use client';

import { useEffect, useState } from 'react';
import '@/components/activate/activate-flow.css';
import {
  activateInputClass,
  activatePrimaryBtnClass,
} from '@/components/activate/activate-shell';
import { FormAlert } from '@/components/forms/form-alert';
import {
  MentorOfferSchema,
  OFFERED_SERVICE_IDS,
  type MentorOffer,
} from '@/lib/expert-offer/schema';

export const OFFER_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
] as const;

const WEEKDAYS = [
  { weekday: 0, label: 'Sunday' },
  { weekday: 1, label: 'Monday' },
  { weekday: 2, label: 'Tuesday' },
  { weekday: 3, label: 'Wednesday' },
  { weekday: 4, label: 'Thursday' },
  { weekday: 5, label: 'Friday' },
  { weekday: 6, label: 'Saturday' },
] as const;

const SERVICE_OPTIONS = [
  { id: 'session_1on1', label: 'Live 1:1' },
  { id: 'pre_call_brief', label: 'Pre-call brief' },
  { id: 'extended_session', label: 'Extended session' },
] as const;

export const SERVICES_COPY =
  'Choose what buyers can book. You can change this later in settings.';

export const HOURS_COPY =
  'Calls can be booked only inside these hours after you save them. Leave this blank only if ops is still scheduling you by hand.';

const SERVICE_MESSAGE = 'Choose a live service or a video review.';
const VIDEO_MESSAGE =
  'Enter a personal video price between $25 and $500, and a delivery window of 3 to 14 days.';

type ServiceId = (typeof OFFERED_SERVICE_IDS)[number];
type TimezoneId = (typeof OFFER_TIMEZONES)[number];

export type DayTimes = { start: string; end: string };

export type OfferFieldsValue = {
  services: ServiceId[];
  personalVideo: boolean;
  videoPriceDollars: string;
  slaDays: string;
  timezone: string;
  days: DayTimes[];
};

type OfferApi = {
  services?: string[];
  videoRequest?: { enabled: boolean; priceCents?: number; slaDays?: number };
  timezone?: string | null;
  windows?: { weekday: number; startMinute: number; endMinute: number }[];
  error?: string;
};

function blankDays(): DayTimes[] {
  return WEEKDAYS.map(() => ({ start: '', end: '' }));
}

export function blankOfferFields(): OfferFieldsValue {
  return {
    services: [],
    personalVideo: false,
    videoPriceDollars: '',
    slaDays: '',
    timezone: 'America/Chicago',
    days: blankDays(),
  };
}

function wholeNumber(raw: string): number {
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

function timeToMinute(value: string): number {
  const match = /^(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minuteToTime(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function isServiceId(value: string): value is ServiceId {
  return (OFFERED_SERVICE_IDS as readonly string[]).includes(value);
}

export function offerFieldsFromApi(data: OfferApi): OfferFieldsValue {
  const days = blankDays();
  for (const window of data.windows ?? []) {
    if (window.weekday < 0 || window.weekday > 6) continue;
    days[window.weekday] = {
      start: minuteToTime(window.startMinute),
      end: minuteToTime(window.endMinute),
    };
  }

  const video = data.videoRequest;
  const timezone = data.timezone?.trim() || 'America/Chicago';
  return {
    services: (data.services ?? []).filter(isServiceId),
    personalVideo: Boolean(video?.enabled),
    videoPriceDollars:
      video?.enabled && typeof video.priceCents === 'number'
        ? String(Math.round(video.priceCents / 100))
        : '',
    slaDays: video?.enabled && typeof video.slaDays === 'number' ? String(video.slaDays) : '',
    timezone,
    days,
  };
}

export function buildMentorOffer(
  hourlyRateDollars: number,
  fields: OfferFieldsValue,
): { ok: true; offer: MentorOffer } | { ok: false; error: string } {
  if (fields.services.length === 0 && !fields.personalVideo) {
    return { ok: false, error: SERVICE_MESSAGE };
  }

  let partialLabel: string | null = null;
  const windows: MentorOffer['windows'] = [];
  fields.days.forEach((day, weekday) => {
    const start = day.start.trim();
    const end = day.end.trim();
    if (!start && !end) return;
    if (!start || !end) {
      partialLabel ??= WEEKDAYS[weekday]?.label ?? 'that day';
      return;
    }
    windows.push({
      weekday,
      startMinute: timeToMinute(start),
      endMinute: timeToMinute(end),
    });
  });

  if (partialLabel) {
    return { ok: false, error: `Enter both a start and an end for ${partialLabel}.` };
  }

  const parsed = MentorOfferSchema.safeParse({
    hourlyRateDollars,
    services: fields.services,
    videoRequest: fields.personalVideo
      ? {
          enabled: true as const,
          priceCents: wholeNumber(fields.videoPriceDollars) * 100,
          slaDays: wholeNumber(fields.slaDays),
        }
      : { enabled: false as const },
    timezone: fields.timezone,
    windows,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = String(issue?.path[0] ?? '');
    if (key === 'hourlyRateDollars') {
      return { ok: false, error: 'Enter an hourly rate between $1 and $10,000.' };
    }
    if (key === 'videoRequest') return { ok: false, error: VIDEO_MESSAGE };
    if (key === 'timezone') return { ok: false, error: 'Choose a timezone.' };
    return { ok: false, error: issue?.message ?? 'Check the offer.' };
  }

  return { ok: true, offer: parsed.data };
}

/** Services step: ignore hours so a later weekday row does not block this step. */
export function validateOfferChoice(
  hourlyRateDollars: number,
  fields: OfferFieldsValue,
): string | null {
  const built = buildMentorOffer(hourlyRateDollars, { ...fields, days: blankDays() });
  return built.ok ? null : built.error;
}

function toggleService(current: ServiceId[], id: ServiceId, checked: boolean): ServiceId[] {
  if (checked) return current.includes(id) ? current : [...current, id];
  return current.filter((service) => service !== id);
}

export function OfferServicesFields({
  value,
  onChange,
  disabled = false,
}: {
  value: OfferFieldsValue;
  onChange: (next: OfferFieldsValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className="activate-field-stack mt-8">
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Services</legend>
        {SERVICE_OPTIONS.map((service) => (
          <label key={service.id} className="activate-payout-option">
            <input
              type="checkbox"
              name="services"
              value={service.id}
              checked={value.services.includes(service.id)}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  services: toggleService(value.services, service.id, event.target.checked),
                })
              }
            />
            <span>{service.label}</span>
          </label>
        ))}
        <label className="activate-payout-option">
          <input
            type="checkbox"
            name="personalVideo"
            checked={value.personalVideo}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, personalVideo: event.target.checked })}
          />
          <span>Personal video</span>
        </label>
      </fieldset>

      {value.personalVideo ? (
        <>
          <div>
            <label className="activate-label" htmlFor="offer-video-price">
              Personal video price (USD)
            </label>
            <input
              id="offer-video-price"
              name="videoPriceDollars"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value.videoPriceDollars}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, videoPriceDollars: event.target.value })}
              className={activateInputClass}
            />
          </div>
          <div>
            <label className="activate-label" htmlFor="offer-sla-days">
              Days to deliver
            </label>
            <input
              id="offer-sla-days"
              name="slaDays"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value.slaDays}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, slaDays: event.target.value })}
              className={activateInputClass}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function OfferHoursFields({
  value,
  onChange,
  disabled = false,
}: {
  value: OfferFieldsValue;
  onChange: (next: OfferFieldsValue) => void;
  disabled?: boolean;
}) {
  const zones: string[] = (OFFER_TIMEZONES as readonly string[]).includes(value.timezone)
    ? [...OFFER_TIMEZONES]
    : [value.timezone, ...OFFER_TIMEZONES];

  function updateDay(weekday: number, key: keyof DayTimes, nextValue: string) {
    onChange({
      ...value,
      days: value.days.map((day, index) =>
        index === weekday ? { ...day, [key]: nextValue } : day,
      ),
    });
  }

  return (
    <div className="activate-field-stack mt-8">
      <div>
        <label className="activate-label" htmlFor="offer-timezone">
          Timezone
        </label>
        <select
          id="offer-timezone"
          name="timezone"
          value={value.timezone}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, timezone: event.target.value as TimezoneId })
          }
          className={activateInputClass}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">Hours</legend>
        {WEEKDAYS.map((day) => (
          <fieldset key={day.weekday} aria-label={day.label}>
            <legend className="activate-label">{day.label}</legend>
            <div className="activate-field-grid activate-field-grid-2">
              <label className="activate-label" htmlFor={`offer-${day.label}-start`}>
                Start
                <input
                  id={`offer-${day.label}-start`}
                  type="time"
                  value={value.days[day.weekday]?.start ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateDay(day.weekday, 'start', event.target.value)}
                  className={`${activateInputClass} mt-1`}
                />
              </label>
              <label className="activate-label" htmlFor={`offer-${day.label}-end`}>
                End
                <input
                  id={`offer-${day.label}-end`}
                  type="time"
                  value={value.days[day.weekday]?.end ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateDay(day.weekday, 'end', event.target.value)}
                  className={`${activateInputClass} mt-1`}
                />
              </label>
            </div>
          </fieldset>
        ))}
      </fieldset>
    </div>
  );
}

export function MentorOfferEditor({ hourlyRateDollars }: { hourlyRateDollars: number }) {
  const [fields, setFields] = useState<OfferFieldsValue>(blankOfferFields);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/mentor/offer');
        const data = (await response.json().catch(() => null)) as OfferApi | null;
        if (cancelled) return;
        if (response.ok && data && Array.isArray(data.services)) {
          setFields(offerFieldsFromApi(data));
          return;
        }
        setError(data?.error ?? 'Could not load offer.');
      } catch {
        if (!cancelled) setError('Could not load offer.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    setSaved(false);
    const built = buildMentorOffer(hourlyRateDollars, fields);
    if (!built.ok) {
      setError(built.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/mentor/offer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(built.offer),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !result?.success) {
        setError(result?.error ?? 'Could not save offer.');
        return;
      }
      setSaved(true);
    } catch {
      setError('Check your network and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="activate-flow" data-testid="mentor-offer-settings">
      <h2 className="activate-section-title">Services</h2>
      <p className="activate-section-copy">{SERVICES_COPY}</p>
      <p className="activate-section-copy">Hourly rate ${hourlyRateDollars}</p>
      <OfferServicesFields value={fields} onChange={setFields} disabled={pending} />

      <h2 className="activate-section-title" style={{ marginTop: '2.5rem' }}>
        Hours
      </h2>
      <p className="activate-section-copy">{HOURS_COPY}</p>
      <OfferHoursFields value={fields} onChange={setFields} disabled={pending} />

      {error ? (
        <div className="mt-6">
          <FormAlert message={error} />
        </div>
      ) : null}
      {saved ? (
        <p className="activate-section-copy" data-testid="mentor-offer-saved">
          Offer saved.
        </p>
      ) : null}
      <button
        type="button"
        className={`${activatePrimaryBtnClass} mt-8`}
        disabled={pending}
        onClick={() => void onSave()}
        data-testid="mentor-offer-save"
      >
        {pending ? 'Saving…' : 'Save services and hours'}
      </button>
    </div>
  );
}
