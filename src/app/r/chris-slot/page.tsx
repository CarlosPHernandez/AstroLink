import { ChrisSlotPicker } from '@/components/chris-campaign/chris-slot-picker';
import { isChrisDayKey } from '@/lib/chris-campaign/chris-availability-slots';
import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import { verifyChrisSlotToken } from '@/lib/chris-campaign/chris-slot-choice-token';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { DEFAULT_MENTOR_IMAGE } from '@/lib/public-images';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ t?: string; day?: string }>;
};

export default async function ChrisSlotPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.t?.trim() ?? '';
  const dayRaw = params.day?.trim() ?? '';
  const initialDayKey = isChrisDayKey(dayRaw) ? dayRaw : null;

  if (!token) {
    return (
      <InvalidState message="This link is missing a token. Open the button in your email, or reply to support@astro-link.space." />
    );
  }

  const verified = verifyChrisSlotToken(token);
  if (!verified.ok) {
    const message =
      verified.reason === 'expired'
        ? 'This link has expired. Reply to your email and we’ll send a fresh one.'
        : 'This link is invalid. Reply to your email and we’ll help you pick a time.';
    return <InvalidState message={message} />;
  }

  const mentorSlug = getChrisMentorSlug();
  const expert = await getMentorBySlug(mentorSlug);

  return (
    <ChrisSlotPicker
      token={token}
      blocks={verified.payload.blocks}
      initialDayKey={initialDayKey}
      expertPortrait={{
        name: expert?.name ?? 'Chris Sembroski',
        imageUrl: expert?.imageUrl ?? DEFAULT_MENTOR_IMAGE,
        introVideoUrl: expert?.introVideoUrl ?? null,
        subtitle: expert?.role ?? 'Commercial Astronaut',
      }}
      copyrightYear={new Date().getFullYear()}
    />
  );
}

function InvalidState({ message }: { message: string }) {
  return (
    <div className="chris-landing flex min-h-screen flex-col items-center justify-center bg-primary-container px-6 text-center text-white">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-secondary-fixed-dim">
        Private session · Chris
      </p>
      <h1 className="mb-3 text-2xl font-semibold">We couldn’t open this link</h1>
      <p className="max-w-[28rem] text-sm font-light leading-relaxed text-secondary-fixed-dim">
        {message}
      </p>
      <a
        href="mailto:support@astro-link.space"
        className="mt-6 text-sm font-light text-tertiary-fixed-dim underline-offset-4 hover:underline"
      >
        Email support@astro-link.space
      </a>
    </div>
  );
}
