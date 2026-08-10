import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const FEATURES = [
  { number: '01', title: 'Live 1:1 video', body: 'A private session with a verified expert — not a forum thread, not a chatbot.' },
  { number: '02', title: 'AI-generated pre-call brief', body: 'A personalized briefing before every session, so you get straight to your question.' },
  { number: '03', title: 'Verified profiles', body: 'Real credentials and an intro video on every expert, before you ever book.' },
  { number: '04', title: 'Session recap & action items', body: 'A summary and next steps generated from the call, so nothing gets lost after you hang up.' },
  { number: '05', title: 'Live captions & translation', body: 'Follow along in the moment and get a localized recap afterward.' },
  { number: '06', title: 'Clear pricing', body: 'Rates are on every profile up front — no hidden fees, no bundles.' },
] as const;

export function LandingFeaturesGrid() {
  return (
    <section
      id="features"
      className="border-t border-[var(--landing-border)] bg-[var(--landing-surface)] py-10 sm:py-16 lg:py-20 scroll-mt-20"
    >
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent)] mb-2">
          What you get
        </p>
        <h2 className="font-landing-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--landing-text)] mb-3 max-w-[20ch]">
          Everything around the call, handled.
        </h2>
        <p className="text-sm sm:text-base text-[var(--landing-muted)] max-w-[60ch] mb-9 sm:mb-10">
          A session is more than the video call — here&apos;s what&apos;s built around it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-8">
          {FEATURES.map((feature, i) => (
            <LandingScrollReveal key={feature.number} as="div" delay={i * 60} variant="up">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--landing-ink)] text-xs font-bold text-white mb-3.5">
                {feature.number}
              </div>
              <p className="font-semibold text-[15px] text-[var(--landing-text)] mb-1.5">{feature.title}</p>
              <p className="text-sm leading-relaxed text-[var(--landing-muted)]">{feature.body}</p>
            </LandingScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
