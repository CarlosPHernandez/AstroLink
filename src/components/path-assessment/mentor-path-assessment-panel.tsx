'use client';

import type { MentorPathAssessmentSummary } from '@/lib/mentor-booking-partition';

/**
 * Mentor-facing panel when a booking has an attached Space Path Assessment.
 */
export function MentorPathAssessmentPanel({
  assessment,
}: {
  assessment: MentorPathAssessmentSummary;
}) {
  return (
    <div
      className="mt-3 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3"
      data-testid="mentor-path-assessment-panel"
    >
      <p className="md-card-label">Space Path Assessment</p>
      {assessment.headline ? (
        <p className="mt-1 text-label-md font-semibold text-on-surface">{assessment.headline}</p>
      ) : null}
      {assessment.standingSummary ? (
        <p className="mt-1.5 text-label-sm text-on-surface-variant leading-relaxed line-clamp-4">
          {assessment.standingSummary}
        </p>
      ) : null}

      <dl className="mt-3 grid gap-2 text-label-sm">
        {assessment.stage ? (
          <div>
            <dt className="text-on-surface-variant">Stage</dt>
            <dd className="text-on-surface">{assessment.stage}</dd>
          </div>
        ) : null}
        {assessment.primaryGoal ? (
          <div>
            <dt className="text-on-surface-variant">Primary goal</dt>
            <dd className="text-on-surface leading-relaxed">{assessment.primaryGoal}</dd>
          </div>
        ) : null}
        {assessment.network ? (
          <div>
            <dt className="text-on-surface-variant">Network</dt>
            <dd className="text-on-surface">{assessment.network}</dd>
          </div>
        ) : null}
        {assessment.obstacle ? (
          <div>
            <dt className="text-on-surface-variant">Obstacle</dt>
            <dd className="text-on-surface leading-relaxed">{assessment.obstacle}</dd>
          </div>
        ) : null}
      </dl>

      {assessment.keyGaps.length > 0 ? (
        <div className="mt-3">
          <p className="text-label-sm font-medium text-on-surface">Key gaps</p>
          <ul className="mt-1 space-y-1.5 text-label-sm text-on-surface-variant">
            {assessment.keyGaps.map((gap) => (
              <li key={gap.title}>
                <span className="font-medium text-on-surface">{gap.title}: </span>
                {gap.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {assessment.focusAreas.length > 0 ? (
        <p className="mt-3 text-label-sm text-on-surface-variant">
          <span className="font-medium text-on-surface">Focus: </span>
          {assessment.focusAreas.join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
