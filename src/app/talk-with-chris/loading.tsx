export default function TalkWithChrisLoading() {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#1c1c1c] text-white"
      aria-busy="true"
      aria-label="Loading Chris Sembroski sessions"
    >
      <div className="mx-auto w-full max-w-7xl flex-grow px-6 py-20 md:px-12">
        <div className="flex w-full flex-col gap-12 lg:flex-row lg:items-center lg:gap-24">
          <div className="w-full space-y-6 lg:w-1/2">
            <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-16 w-full max-w-xl animate-pulse rounded bg-white/10" />
            <div className="h-20 w-full max-w-lg animate-pulse rounded bg-white/10" />
            <div className="h-12 w-full max-w-[28rem] animate-pulse rounded bg-white/10" />
            <div className="h-14 w-full max-w-[28rem] animate-pulse rounded-lg bg-white/15" />
          </div>
          <div className="hidden aspect-[4/5] w-full max-w-[28rem] animate-pulse rounded-3xl bg-white/10 md:block" />
        </div>
      </div>
    </div>
  );
}