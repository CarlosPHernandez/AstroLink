'use client';

import React, { useMemo } from 'react';

import {
  DEFAULT_SCHEDULE_PRESETS,
  datetimeLocalForEasternToday,
  formatEasternPreview,
  formatLocalPreview,
  type SchedulePreset,
} from '@/lib/session-schedule';

type SessionSchedulePickerProps = {
  id?: string;
  value: string;
  onChange: (datetimeLocal: string) => void;
  required?: boolean;
  fieldClass?: string;
  presets?: SchedulePreset[];
  'data-testid'?: string;
};

export function SessionSchedulePicker({
  id = 'scheduledAt',
  value,
  onChange,
  required = true,
  fieldClass = '',
  presets = DEFAULT_SCHEDULE_PRESETS,
  'data-testid': testId = 'booking-scheduled-at',
}: SessionSchedulePickerProps) {
  const easternPreview = useMemo(() => formatEasternPreview(value), [value]);
  const localPreview = useMemo(() => formatLocalPreview(value), [value]);

  return (
    <div className="space-y-3" data-testid="session-schedule-picker">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const presetValue = datetimeLocalForEasternToday(preset.hourEt, preset.minuteEt);
          const active = value === presetValue;
          return (
            <button
              key={preset.id}
              type="button"
              data-testid={`schedule-preset-${preset.id}`}
              onClick={() => onChange(presetValue)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <label htmlFor={id} className="sr-only">
        Session date and time
      </label>
      <input
        id={id}
        data-testid={testId}
        type="datetime-local"
        required={required}
        className={fieldClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {(easternPreview || localPreview) && (
        <div className="rounded-md border border-outline-variant/60 bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant space-y-0.5">
          {localPreview ? (
            <p data-testid="schedule-local-preview">
              <span className="font-semibold text-on-surface">Your device:</span> {localPreview}
            </p>
          ) : null}
          {easternPreview ? (
            <p data-testid="schedule-eastern-preview">
              <span className="font-semibold text-on-surface">Eastern (ops):</span> {easternPreview}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
