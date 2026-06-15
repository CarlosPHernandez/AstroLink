function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-container-low ${className}`} />;
}

export function DashboardPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background p-6 text-on-surface md:p-10"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-outline-variant pb-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-8 w-56" />
            <Pulse className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-3">
            <Pulse className="h-9 w-32" />
            <Pulse className="h-9 w-24" />
          </div>
        </header>

        <div className="space-y-4">
          <Pulse className="h-5 w-40" />
          <Pulse className="h-28 w-full" />
          <Pulse className="h-28 w-full" />
          <Pulse className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

export function BookingPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background text-on-surface font-sans"
      aria-busy="true"
      aria-label="Loading booking"
    >
      <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Pulse className="h-5 w-24" />
          <Pulse className="h-4 w-32" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Pulse className="mb-5 h-4 w-28" />
        <Pulse className="mb-8 h-9 w-64 max-w-full" />
        <div className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-5/6" />
          <Pulse className="h-24 w-full" />
          <Pulse className="h-11 w-full" />
        </div>
      </main>
    </div>
  );
}

export function ExpertProfileSkeleton() {
  return (
    <div
      className="min-h-screen bg-background text-on-surface font-sans"
      aria-busy="true"
      aria-label="Loading expert profile"
    >
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-md sm:px-lg">
          <Pulse className="h-6 w-24" />
          <div className="flex items-center gap-3">
            <Pulse className="h-9 w-20" />
            <Pulse className="h-9 w-28" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-lg pb-24 pt-8 md:pt-12">
        <div className="mb-12 grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Pulse className="mx-auto aspect-[3/4] w-full max-w-[360px] lg:mx-0" />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <Pulse className="h-6 w-40" />
            <Pulse className="h-10 w-3/4" />
            <Pulse className="h-5 w-1/2" />
            <Pulse className="h-5 w-2/3" />
            <Pulse className="mt-4 h-12 w-full" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-12">
          <Pulse className="h-40 lg:col-span-7" />
          <Pulse className="h-56 lg:col-span-5" />
        </div>
      </main>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background text-on-surface font-sans"
      aria-busy="true"
      aria-label="Loading home"
    >
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-md sm:px-lg">
          <Pulse className="h-6 w-24" />
          <div className="flex items-center gap-3">
            <Pulse className="h-4 w-16" />
            <Pulse className="h-9 w-28" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-md py-12 sm:px-lg">
        <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center">
          <Pulse className="mx-auto h-12 w-full max-w-2xl" />
          <Pulse className="mx-auto h-6 w-full max-w-xl" />
        </div>
        <Pulse className="mx-auto aspect-[4/5] w-full max-w-[480px] rounded-2xl" />
      </main>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-background p-8 font-sans text-on-surface"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col justify-between gap-6 border-b border-outline-variant pb-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <Pulse className="h-3 w-16" />
            <Pulse className="h-8 w-32" />
          </div>
          <Pulse className="h-9 w-28" />
        </header>
        <div className="space-y-4 rounded-md border border-outline-variant bg-surface-container-lowest p-6">
          <Pulse className="h-10 w-full" />
          <Pulse className="h-10 w-full" />
          <Pulse className="h-24 w-full" />
          <Pulse className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}