/**
 * Skeleton placeholders for the four highest-traffic loading states.
 * Drop-in: <FeedSkeleton />, <BookingsSkeleton />, <DashboardSkeleton />, <ProfileSkeleton />
 */

function Block({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200/70 rounded-md animate-pulse ${className}`} />;
}

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 mx-3 lg:mx-0 mb-3 px-5 py-4 lg:px-6 lg:py-5">
      <div className="flex gap-3">
        <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-slate-200/70 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Block className="h-3 w-32" />
            <Block className="h-2 w-14" />
          </div>
          <Block className="h-3.5 w-full" />
          <Block className="h-3.5 w-5/6" />
          <div className="rounded-2xl bg-slate-100 animate-pulse aspect-[3/2] mt-2" />
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
            <Block className="h-3 w-10" />
            <Block className="h-3 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="pt-3" aria-busy="true" aria-label="Loading feed">
      <div className="flex gap-3 px-3 lg:px-0 mb-3 overflow-hidden">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="w-16 h-16 rounded-full bg-slate-200/70 animate-pulse flex-shrink-0" />
        ))}
      </div>
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}

export function BookingsSkeleton() {
  return (
    <div className="space-y-3 px-4 sm:px-6 py-6" aria-busy="true" aria-label="Loading bookings">
      <Block className="h-7 w-44" />
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <Block className="h-4 w-32" />
          <div className="flex-1" />
          <Block className="h-8 w-24 rounded-lg" />
        </div>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="px-5 py-3.5 border-b border-slate-100 grid grid-cols-5 gap-3 items-center">
            <Block className="h-3.5 w-20" />
            <Block className="h-3.5 w-24" />
            <Block className="h-3.5 w-16" />
            <Block className="h-3.5 w-14" />
            <Block className="h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-4 sm:px-6 py-6" aria-busy="true" aria-label="Loading dashboard">
      <Block className="h-8 w-56" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-2.5">
            <Block className="h-3 w-20" />
            <Block className="h-7 w-24" />
            <Block className="h-2.5 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <Block className="h-4 w-40" />
          <Block className="h-7 w-20 rounded-lg" />
        </div>
        <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
          <Block className="h-4 w-32" />
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200/70 animate-pulse" />
              <Block className="h-3 flex-1" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
          <Block className="h-4 w-32" />
          <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 px-4 sm:px-6 py-6 max-w-2xl mx-auto" aria-busy="true" aria-label="Loading profile">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-200/70 animate-pulse" />
        <div className="space-y-2 flex-1">
          <Block className="h-5 w-40" />
          <Block className="h-3 w-32" />
          <Block className="h-2.5 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-4 text-center space-y-2">
            <Block className="h-6 w-12 mx-auto" />
            <Block className="h-2.5 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
        <Block className="h-4 w-40" />
        {[0,1,2,3].map(i => (
          <Block key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}
