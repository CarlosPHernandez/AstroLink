import Image from 'next/image';
import { EducatorsDemoForm } from '@/components/educators/educators-demo-form';

export function EducatorsDemoSection() {
  return (
    <section
      id="demo"
      className="bg-[var(--landing-surface)] py-16 sm:py-20 lg:py-24 scroll-mt-20 border-t border-[var(--landing-border)]"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 lg:items-start">
          <div className="lg:col-span-5">
            <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] lg:max-w-[380px]">
              <Image
                src="/educators/orbital-missions.jpg"
                alt="Students inspired by an orbital Earth view in a modern classroom"
                fill
                sizes="380px"
                className="object-cover object-[center_30%]"
              />
            </div>
            <h2 className="font-landing-display text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold tracking-tight text-[var(--landing-text)] text-balance leading-[1.15]">
              Ready to bring real experts into your classroom?
            </h2>
            <p className="mt-4 text-base text-[var(--landing-muted)] leading-relaxed max-w-[36ch]">
              Tell us about your program and we&apos;ll walk you through the roster and how booking
              works — no obligation.
            </p>
            <ul className="mt-8 space-y-3 text-sm sm:text-[15px] text-[var(--landing-muted)]">
              {[
                'Response within one business day',
                'Tailored to your class or career-day goals',
                'Clear pricing on every expert profile',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-accent)]"
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
