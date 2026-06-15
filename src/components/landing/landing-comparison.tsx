import { MaterialIcon } from '@/components/ui/material-icon';

export function LandingComparison() {
  return (
    <section id="pipeline" className="bg-background py-24 scroll-mt-20 border-t border-outline-variant/30 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary-container/3 to-secondary-container/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-lg relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.25em] mb-4">The Pedigree Standard</span>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-[1.25]">
            AI cannot replace spaceflight pedigree, real mission experience, or true human mentorship.
          </h2>
          <p className="font-body-md text-on-surface-variant font-light mt-6 max-w-2xl leading-relaxed text-sm sm:text-base">
            The margin of error in orbit is zero. Where models hallucinate, pedigree delivers. Connect directly with the people who have commands, launch authorizations, and real operational logs.
          </p>
        </div>

        <div className="border border-outline-variant/60 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-sm">
          <div className="hidden md:grid md:grid-cols-12 border-b border-outline-variant bg-surface-container-low font-mono text-[10px] font-bold text-on-surface uppercase tracking-wider py-4 px-6 md:px-8">
            <div className="md:col-span-4">Comparison Dimension</div>
            <div className="md:col-span-4 text-zinc-400">AI Language Models</div>
            <div className="md:col-span-4 text-primary">AstroLink Mentors</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant/50 hover:bg-surface-container-lowest/60 transition-colors py-8 px-6 md:px-8 items-start">
            <div className="md:col-span-4 pr-4 mb-4 md:mb-0">
              <h4 className="text-sm font-bold text-on-surface">Insight Source</h4>
              <p className="text-[11px] text-on-surface-variant font-light mt-1">Where the knowledge originates and how it is updated.</p>
            </div>
            <div className="md:col-span-4 pr-6 mb-5 md:mb-0 text-xs text-on-surface-variant font-light flex items-start">
              <MaterialIcon name="cancel" className="text-zinc-450 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="md:hidden text-zinc-400 block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AI Language Models</strong>
                <span>Scraped manual archives, training textbooks, and general public forums. No direct engineering experience.</span>
              </div>
            </div>
            <div className="md:col-span-4 text-xs text-on-surface font-light flex items-start">
              <MaterialIcon name="check_circle" className="text-emerald-600 mr-2 flex-shrink-0 mt-0.5" size={16} fill />
              <div>
                <strong className="md:hidden text-primary block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AstroLink Mentors</strong>
                <span>Active flight directors, ISS commanders, and JPL systems engineers with current clearance and credentials.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant/50 hover:bg-surface-container-lowest/60 transition-colors py-8 px-6 md:px-8 items-start">
            <div className="md:col-span-4 pr-4 mb-4 md:mb-0">
              <h4 className="text-sm font-bold text-on-surface">Context Adaptation</h4>
              <p className="text-[11px] text-on-surface-variant font-light mt-1">How responses are tailored to complex aerospace problems.</p>
            </div>
            <div className="md:col-span-4 pr-6 mb-5 md:mb-0 text-xs text-on-surface-variant font-light flex items-start">
              <MaterialIcon name="cancel" className="text-zinc-450 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="md:hidden text-zinc-400 block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AI Language Models</strong>
                <span>Statistical autocompletion. Generates generic, standardized rules, ignoring operational limits and budget rules.</span>
              </div>
            </div>
            <div className="md:col-span-4 text-xs text-on-surface font-light flex items-start">
              <MaterialIcon name="check_circle" className="text-emerald-600 mr-2 flex-shrink-0 mt-0.5" size={16} fill />
              <div>
                <strong className="md:hidden text-primary block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AstroLink Mentors</strong>
                <span>Highly customized code reviews, hardware diagnostic checks, and policy guidance tailored to your vehicle payload.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 hover:bg-surface-container-lowest/60 transition-colors py-8 px-6 md:px-8 items-start">
            <div className="md:col-span-4 pr-4 mb-4 md:mb-0">
              <h4 className="text-sm font-bold text-on-surface">Accountability</h4>
              <p className="text-[11px] text-on-surface-variant font-light mt-1">The liability and reliability of critical data outputs.</p>
            </div>
            <div className="md:col-span-4 pr-6 mb-5 md:mb-0 text-xs text-on-surface-variant font-light flex items-start">
              <MaterialIcon name="cancel" className="text-zinc-450 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="md:hidden text-zinc-400 block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AI Language Models</strong>
                <span>Strict liability disclaimers. Hallucinations are common, and errors can result in mission-ending launch failures.</span>
              </div>
            </div>
            <div className="md:col-span-4 text-xs text-on-surface font-light flex items-start">
              <MaterialIcon name="check_circle" className="text-emerald-600 mr-2 flex-shrink-0 mt-0.5" size={16} fill />
              <div>
                <strong className="md:hidden text-primary block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AstroLink Mentors</strong>
                <span>1-on-1 direct audio/video calls where senior engineers back their operational recommendations with verified careers.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
