import { EducatorsDemoForm } from '@/components/educators/educators-demo-form';

export function EducatorsDemoSection() {
  return (
    <section
      id="demo"
      className="border-t border-[var(--landing-border)] bg-[var(--landing-canvas)] py-12 sm:py-16 lg:py-20 scroll-mt-20"
    >
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="font-landing-display text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--landing-text)] text-balance">
              Ready to bring real experts into your classroom?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed max-w-[36ch]">
              Tell us about your program and we&apos;ll walk you through the roster and how booking
              works — no obligation.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-[var(--landing-muted)]">
              {[
                'Response within one business day',
                'Tailored to your class or career-day goals',
                'Clear pricing on every expert profile',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-accent)]"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <EducatorsDemoForm />
          </div>
        </div>
      </div>
    </section>
  );
}
