import { PRIVACY_POLICY } from '@/content/privacy-policy';

export function PrivacyPolicyDocument() {
  return (
    <article className="min-w-0">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-[1.5rem] sm:text-[1.75rem] font-medium text-on-surface tracking-[-0.02em] leading-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant/80">
          Last updated {PRIVACY_POLICY.lastUpdated}
        </p>
        <p className="mt-4 text-sm sm:text-[15px] text-on-surface-variant/80 leading-relaxed">
          {PRIVACY_POLICY.intro}
        </p>
      </header>

      <div className="space-y-8 sm:space-y-10">
        {PRIVACY_POLICY.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-base font-medium text-on-surface">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm sm:text-[15px] text-on-surface-variant/80 leading-relaxed">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 pt-6 border-t border-outline-variant/50 text-sm text-on-surface-variant/70">
        Questions?{' '}
        <a
          href={`mailto:${PRIVACY_POLICY.contactEmail}`}
          className="text-on-surface hover:opacity-70 transition-opacity underline decoration-on-surface/25 underline-offset-2"
        >
          {PRIVACY_POLICY.contactEmail}
        </a>
      </p>
    </article>
  );
}