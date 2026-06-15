'use client';

import React, { useState, useActionState } from 'react';
import { onboardMentorAction } from '@/app/auth/actions';
import { FieldError } from '@/components/forms/field-error';
import { FormAlert } from '@/components/forms/form-alert';
import { fieldErrorInputClass } from '@/lib/zod-field-errors';

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function OnboardClient({ session }: { session: SessionData }) {
  const [isCivilServant, setIsCivilServant] = useState(false);
  const [state, formAction, isPending] = useActionState(onboardMentorAction, undefined);

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col justify-center items-center p-4 sm:p-gutter relative font-sans selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Container */}
      <main className="w-full max-w-xl animate-reveal-up delay-100">
        
        {/* Header */}
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-md shadow-[0_4px_20px_rgba(0,88,188,0.15)] animate-reveal-down delay-200 group relative">
            <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '28px' }}>shield_person</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight mb-xs animate-reveal-up delay-300">
            Apply as an Aerospace Mentor
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant animate-reveal-up delay-400 max-w-md mx-auto">
            AstraLink enforces strict regulatory compliance. Complete your consultant details to establish active clearance.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-5 sm:p-8 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] animate-reveal-up delay-300">
          
          {/* General Message */}
          {state?.message ? (
            <div className="mb-6 animate-fade-in">
              <FormAlert message={state.message} />
            </div>
          ) : null}

          <form action={formAction} className="space-y-5">
            {/* Identity Group (Pre-populated, read-only to show they are tied to session) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 font-mono text-[9px]">Identity Name</label>
                <input
                  type="text"
                  readOnly
                  className="w-full py-2.5 px-3.5 bg-surface-container-low border border-outline-variant/65 rounded-lg text-on-surface-variant text-xs outline-none cursor-not-allowed font-light"
                  value={session.fullName}
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5 font-mono text-[9px]">Linked Email</label>
                <input
                  type="email"
                  readOnly
                  className="w-full py-2.5 px-3.5 bg-surface-container-low border border-outline-variant/65 rounded-lg text-on-surface-variant text-xs outline-none cursor-not-allowed font-light"
                  value={session.email}
                />
              </div>
            </div>

            {/* Employer Input */}
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="employer">Employer / Institution</label>
              <input
                className={fieldErrorInputClass(
                  !!state?.errors?.employer,
                  'w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow',
                )}
                id="employer"
                name="employer"
                required
                placeholder="e.g. NASA JSC, SpaceX, Lockheed Martin, MIT"
                disabled={isPending}
                aria-invalid={state?.errors?.employer ? true : undefined}
                aria-describedby={state?.errors?.employer ? 'onboard-employer-error' : undefined}
              />
              <FieldError id="onboard-employer-error" message={state?.errors?.employer?.[0]} />
            </div>

            {/* Civil Servant Status Box */}
            <div className="p-4 rounded-lg border border-outline-variant bg-surface-container-low/55 flex items-center justify-between transition-colors">
              <div className="pr-4">
                <h4 className="text-xs font-semibold text-on-surface">Federal Civil Servant Status</h4>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">Do you work directly for a government agency or national laboratory?</p>
              </div>
              <input
                type="checkbox"
                name="isCivilServant"
                id="isCivilServant"
                value="true"
                checked={isCivilServant}
                onChange={(e) => setIsCivilServant(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 text-primary border-outline-variant bg-white rounded focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Scanned PDF Upload Box (Animated entrance) */}
            {isCivilServant && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2.5 animate-fade-in">
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest" htmlFor="file">
                  NASA Form NF-1860 (Outside Employment Approval)
                </label>
                <p className="text-[10px] text-on-surface-variant leading-relaxed font-light">
                  Upload a scanned PDF copy of your approved NF-1860 document. ComplianceAgent will audit signatures and expiration dates.
                </p>
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept=".pdf"
                  required={isCivilServant}
                  disabled={isPending}
                  className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-outline-variant file:border file:text-[9px] file:font-bold file:uppercase file:bg-white file:text-on-surface hover:file:bg-surface-container-low file:cursor-pointer transition-colors"
                />
                <FieldError id="onboard-file-error" message={state?.errors?.file?.[0]} />
              </div>
            )}

            {/* Expertise Fields */}
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="expertise">Expertise Fields (comma-separated)</label>
              <input
                className={fieldErrorInputClass(
                  !!state?.errors?.expertise,
                  'w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow',
                )}
                id="expertise"
                name="expertise"
                required
                placeholder="e.g. Orbital Operations, EVA Protocols, Propulsion Systems"
                disabled={isPending}
                aria-invalid={state?.errors?.expertise ? true : undefined}
                aria-describedby={state?.errors?.expertise ? 'onboard-expertise-error' : undefined}
              />
              <FieldError id="onboard-expertise-error" message={state?.errors?.expertise?.[0]} />
            </div>

            {/* Biography */}
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="bio">Professional Biography</label>
              <textarea
                className={fieldErrorInputClass(
                  !!state?.errors?.bio,
                  'w-full py-sm px-md font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow resize-none leading-relaxed font-light',
                )}
                id="bio"
                name="bio"
                required
                rows={4}
                placeholder="Describe your background and mission control/space systems pedigree. Our audit loops run bio-risk analysis checks on civil servant profiles."
                disabled={isPending}
                aria-invalid={state?.errors?.bio ? true : undefined}
                aria-describedby={state?.errors?.bio ? 'onboard-bio-error' : undefined}
              />
              <FieldError id="onboard-bio-error" message={state?.errors?.bio?.[0]} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full py-sm px-md bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-on-primary-fixed-variant transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex justify-center items-center gap-xs group/btn cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Application Paperwork...
                </>
              ) : (
                <>
                  Submit & Sync Stripe Payouts
                  <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform" style={{ fontSize: '18px' }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

      </main>

    </div>
  );
}
