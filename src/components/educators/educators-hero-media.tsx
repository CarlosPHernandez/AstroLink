import Image from 'next/image';

type EducatorsHeroMediaProps = {
  src: string;
  alt: string;
};

/**
 * Hero still with subtle Ken Burns drift (CSS).
 * Respects prefers-reduced-motion via globals.css.
 * Native video loops can replace this when export is available.
 */
export function EducatorsHeroMedia({ src, alt }: EducatorsHeroMediaProps) {
  return (
    <div className="relative aspect-[16/9] w-full sm:aspect-[2/1] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1200px) 100vw, 1200px"
        className="educators-hero-kenburns object-cover object-[center_45%] will-change-transform"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(14,20,32,0.12)] via-transparent to-transparent"
        aria-hidden
      />
    </div>
  );
}
