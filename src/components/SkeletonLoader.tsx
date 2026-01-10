export function PostSkeleton() {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-2"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
      </div>

      {/* Actions */}
      <div className="flex gap-8 mt-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
    </div>
  );
}

export function StoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-4 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <StorySkeleton key={i} />
      ))}
    </div>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
        </div>
      </div>
      <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
    </div>
  );
}

export function CourtCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-700"></div>
      <div className="p-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Cover */}
      <div className="h-32 lg:h-48 bg-slate-200 dark:bg-slate-800"></div>

      {/* Profile info */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-4 -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900"></div>
          <div className="flex-1 pt-20">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-12 mx-auto mb-1"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
      </div>
    </div>
  );
}
