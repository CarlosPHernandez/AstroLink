export default function TalkWithChrisLoading() {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#1c1c1c] text-white"
      aria-busy="true"
      aria-label="Loading Chris Sembroski sessions"
    >
      {/* Phone skeleton (<768px) */}
      <div className="mx-auto w-full max-w-[32rem] flex-grow md:hidden">
        <div className="h-[50vh] w-full animate-pulse bg-white/10" />
        <div className="space-y-4 px-6 pt-6">
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-[80%] animate-pulse rounded bg-white/10" />
          <div className="h-40 w-full animate-pulse rounded bg-white/10" />
          <div className="h-14 w-full animate-pulse rounded-lg bg-white/15" />
        </div>
      </div>

      {/* Tablet + desktop skeleton (>=768px) */}
      <div className="mx-auto hidden w-full max-w-[80rem] flex-grow px-6 py-16 md:block md:px-10 lg:px-12 lg:py-20">
        <div className="flex w-full flex-col gap-10 md:items-start md:gap-12 lg:flex-row lg:items-center lg:gap-24">
          <div className="w-full space-y-6 lg:w-[50%]">
            <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-16 w-full max-w-[36rem] animate-pulse rounded bg-white/10" />
            <div className="h-20 w-full max-w-[32rem] animate-pulse rounded bg-white/10" />
            <div className="h-12 w-full max-w-[28rem] animate-pulse rounded bg-white/10" />
            <div className="h-14 w-full max-w-[28rem] animate-pulse rounded-lg bg-white/15" />
          </div>
          <div className="mx-auto aspect-[4/5] w-full max-w-[22rem] animate-pulse rounded-3xl bg-white/10 lg:mx-0 lg:w-[41.666667%] lg:max-w-[28rem]" />
        </div>
      </div>
    </div>
  );
}