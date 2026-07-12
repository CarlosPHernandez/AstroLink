import Link from 'next/link';

const BENEFITS = [
  { line1: 'Verified operators', line2: 'with mission pedigree' },
  { line1: 'Live 1:1 video', line2: 'not chatbot autocomplete' },
  { line1: 'Clear pricing', line2: 'before you book' },
] as const;

export function LandingBenefits() {
  return (
    <section id="pipeline" className="scroll-mt-20 py-20 sm:py-28 border-t border-neutral-200/60">
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center md:text-left">
          {BENEFITS.map((benefit) => (
            <h2
              key={benefit.line1}
              className="font-landing-display text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 leading-[1.15]"
            >
              {benefit.line1}
              <br />
              <span className="text-neutral-400">{benefit.line2}</span>
            </h2>
          ))}
        </div>

        <p className="mt-16 sm:mt-20 text-center text-sm sm:text-base text-neutral-500 max-w-[var(--max-width-prose)] mx-auto leading-relaxed">
          AI pulls from manuals and forums. AstroLink mentors answer from flight logs, launch
          authority, and years on console — then stand behind the recommendation on a live call.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center rounded-full bg-[#1a5fd1] px-8 py-3 text-sm font-semibold text-white hover:bg-[#164fb3] transition-colors"
          >
            Book a session
          </Link>
        </div>
      </div>
    </section>
  );
}