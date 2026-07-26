'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';
import type { MentorProfileActionState } from '@/app/dashboard/mentor/actions';
import {
  PAYOUT_NAV_LABELS,
  type PayoutNavStatus,
} from '@/lib/mentor-payouts-config';

export type MentorSettingsSection = 'account' | 'password' | 'compliance';

const SETTINGS_SECTIONS: {
  id: MentorSettingsSection;
  label: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'account',
    label: 'Account',
    title: 'Account',
    description: 'Sign-in identity and how you appear in the product.',
  },
  {
    id: 'password',
    label: 'Password',
    title: 'Password',
    description: 'Change the password you use to sign in to your expert dashboard.',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    title: 'Compliance',
    description: 'Civil servant disclosure and NF-1860 documentation.',
  },
];

export function MentorSettingsPanel({
  fullName,
  email,
  payoutNavStatus,
  isCivilServant,
  onCivilServantChange,
  pdfUploaded,
  uploadPending,
  uploadState,
  onPdfUpload,
  passwordFormRef,
  passwordAction,
  passwordState,
  passwordPending,
}: {
  fullName: string;
  email: string;
  payoutNavStatus: PayoutNavStatus;
  isCivilServant: boolean;
  onCivilServantChange: (checked: boolean) => void;
  pdfUploaded: boolean;
  uploadPending: boolean;
  uploadState: MentorProfileActionState | undefined;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  passwordFormRef: React.RefObject<HTMLFormElement | null>;
  passwordAction: (payload: FormData) => void;
  passwordState: MentorProfileActionState | undefined;
  passwordPending: boolean;
}) {
  const [section, setSection] = useState<MentorSettingsSection>('account');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [query]);

  const active = SETTINGS_SECTIONS.find((s) => s.id === section) ?? SETTINGS_SECTIONS[0];

  return (
    <div className="md-settings" data-testid="mentor-settings-tab">
      <header className="md-settings-header">
        <nav className="md-settings-crumbs" aria-label="Breadcrumb">
          <span className="md-settings-crumb md-settings-crumb-current">Settings</span>
          <span className="md-settings-crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="md-settings-crumb">{active.label}</span>
        </nav>
      </header>

      <div className="md-settings-body">
        <aside className="md-settings-side" aria-label="Settings sections">
          <label className="md-settings-search">
            <span className="sr-only">Search settings</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="md-settings-search-icon"
            >
              <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.33" />
              <path
                d="M10.5 10.5 13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              data-testid="mentor-settings-search"
            />
          </label>

          <nav className="md-settings-subnav" role="tablist" aria-label="Settings categories">
            {filtered.length === 0 ? (
              <p className="md-settings-empty">No matches</p>
            ) : (
              filtered.map((item) => {
                const selected = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSection(item.id)}
                    data-testid={`mentor-settings-section-${item.id}`}
                    className={
                      selected
                        ? 'md-settings-subitem md-settings-subitem-active'
                        : 'md-settings-subitem'
                    }
                  >
                    <span>{item.label}</span>
                    {selected ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                        className="md-settings-subitem-chevron"
                      >
                        <path
                          d="M8 5.5 12.5 10 8 14.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </button>
                );
              })
            )}
          </nav>
        </aside>

        <div className="md-settings-main">
          <div className="md-settings-main-head">
            <h1 className="md-settings-title">{active.title}</h1>
            <p className="md-settings-desc">{active.description}</p>
          </div>

          <div className="md-settings-panel" role="tabpanel">
            {section === 'account' ? (
              <div className="md-settings-fields" data-testid="mentor-settings-account">
                <p className="md-settings-section-label">Personal information</p>

                <div className="md-settings-field">
                  <label htmlFor="mentor-settings-name">Name</label>
                  <input
                    id="mentor-settings-name"
                    type="text"
                    value={fullName}
                    readOnly
                    className="md-settings-input"
                  />
                </div>

                <div className="md-settings-field">
                  <label htmlFor="mentor-settings-email">Email</label>
                  <input
                    id="mentor-settings-email"
                    type="email"
                    value={email}
                    readOnly
                    className="md-settings-input"
                  />
                  <p className="md-settings-hint">
                    Sign-in email is managed by your account. Contact support to change it.
                  </p>
                </div>

                <div className="md-settings-field">
                  <label htmlFor="mentor-settings-payouts">Payouts</label>
                  <input
                    id="mentor-settings-payouts"
                    type="text"
                    value={PAYOUT_NAV_LABELS[payoutNavStatus]}
                    readOnly
                    className="md-settings-input"
                    data-testid="mentor-settings-payout-status"
                  />
                  <p className="md-settings-hint">
                    Manage payouts and ledger under{' '}
                    <span className="md-settings-hint-em">Earnings</span> in the sidebar.
                  </p>
                </div>
              </div>
            ) : null}

            {section === 'password' ? (
              <form
                ref={passwordFormRef}
                action={passwordAction}
                className="md-settings-fields"
                data-testid="mentor-password-form"
              >
                <p className="md-settings-section-label">Security</p>

                {passwordState?.success ? (
                  <p className="md-settings-success" data-testid="mentor-password-success">
                    {passwordState.message ?? 'Password updated.'}
                  </p>
                ) : null}
                {passwordState?.message && !passwordState.success ? (
                  <FormAlert message={passwordState.message} />
                ) : null}

                <div className="md-settings-field">
                  <label htmlFor="mentor-current-password">Current password</label>
                  <input
                    id="mentor-current-password"
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={passwordPending}
                    data-testid="mentor-current-password"
                    className={fieldErrorInputClass(
                      !!passwordState?.errors?.currentPassword,
                      'md-settings-input',
                    )}
                  />
                  <FieldError message={passwordState?.errors?.currentPassword?.[0]} />
                </div>

                <div className="md-settings-field-row">
                  <div className="md-settings-field">
                    <label htmlFor="mentor-new-password">New password</label>
                    <input
                      id="mentor-new-password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={passwordPending}
                      data-testid="mentor-new-password"
                      className={fieldErrorInputClass(
                        !!passwordState?.errors?.password,
                        'md-settings-input',
                      )}
                    />
                    <FieldError message={passwordState?.errors?.password?.[0]} />
                  </div>
                  <div className="md-settings-field">
                    <label htmlFor="mentor-confirm-password">Confirm password</label>
                    <input
                      id="mentor-confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={passwordPending}
                      data-testid="mentor-confirm-password"
                      className={fieldErrorInputClass(
                        !!passwordState?.errors?.confirmPassword,
                        'md-settings-input',
                      )}
                    />
                    <FieldError message={passwordState?.errors?.confirmPassword?.[0]} />
                  </div>
                </div>

                <p className="md-settings-hint">
                  Forgot your current password?{' '}
                  <Link href="/auth/forgot-password" className="md-settings-link">
                    Reset via email
                  </Link>
                </p>

                <button
                  type="submit"
                  disabled={passwordPending}
                  className="md-settings-btn"
                  data-testid="mentor-password-submit"
                >
                  {passwordPending ? 'Updating…' : 'Update password'}
                </button>
              </form>
            ) : null}

            {section === 'compliance' ? (
              <div
                className="md-settings-fields"
                data-testid="mentor-settings-compliance"
              >
                <p className="md-settings-section-label">Outside activity</p>

                <label
                  className="md-settings-check-row"
                  data-testid="mentor-civil-servant-row"
                >
                  <span>
                    <span className="md-settings-check-title">Federal civil servant</span>
                    <span className="md-settings-hint">
                      Requires NASA Form NF-1860 for outside consulting.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    aria-label="Federal civil servant"
                    checked={isCivilServant}
                    onChange={(e) => onCivilServantChange(e.target.checked)}
                    className="md-settings-checkbox"
                  />
                </label>

                {isCivilServant ? (
                  <div className="md-settings-field">
                    <label htmlFor="mentor-nf1860-upload">NF-1860 upload</label>
                    <input
                      id="mentor-nf1860-upload"
                      type="file"
                      accept=".pdf"
                      onChange={onPdfUpload}
                      disabled={uploadPending}
                      data-testid="mentor-nf1860-upload"
                      className="md-settings-file"
                    />
                    {uploadState?.errors?.file?.[0] ? (
                      <p
                        className="md-settings-error"
                        data-testid="mentor-nf1860-upload-error"
                      >
                        {uploadState.errors.file[0]}
                      </p>
                    ) : null}
                    {uploadState?.message && !uploadState.success ? (
                      <FormAlert message={uploadState.message} />
                    ) : null}
                    {uploadPending ? (
                      <p className="md-settings-hint">Uploading…</p>
                    ) : null}
                    {pdfUploaded ? (
                      <p className="md-settings-success">Document received.</p>
                    ) : null}
                  </div>
                ) : null}

                <p className="md-settings-hint">
                  Public listing details (bio, rate, expertise) stay under{' '}
                  <span className="md-settings-hint-em">Listing</span> in the sidebar.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
