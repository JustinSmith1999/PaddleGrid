import { motion } from 'framer-motion';

// Shimmer animation wrapper
function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 rounded-lg ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ translateX: ['−100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{ transform: 'translateX(-100%)' }}
      />
    </div>
  );
}

// Generic skeleton line
export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <Shimmer className={`${width} ${height}`} />;
}

// Dashboard KPI card skeleton
export function SkeletonKPICard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <Shimmer className="w-9 h-9 rounded-xl" />
        <Shimmer className="w-20 h-3" />
      </div>
      <Shimmer className="w-24 h-7" />
      <Shimmer className="w-16 h-3" />
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <Shimmer className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Shimmer className="w-32 h-4" />
        <Shimmer className="w-20 h-3" />
      </div>
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Shimmer key={i} className="w-16 h-4" />
      ))}
    </div>
  );
}

// Card grid skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="w-20 h-5 rounded-full" />
        <Shimmer className="w-12 h-4 rounded-full" />
      </div>
      <Shimmer className="w-3/4 h-5" />
      <Shimmer className="w-full h-3" />
      <Shimmer className="w-2/3 h-3" />
      <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
        <Shimmer className="w-14 h-3" />
        <Shimmer className="w-14 h-3" />
      </div>
      <Shimmer className="w-full h-9 rounded-xl" />
    </div>
  );
}

// Full page loading skeleton for dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="w-48 h-7" />
          <Shimmer className="w-32 h-4" />
        </div>
        <Shimmer className="w-24 h-10 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <Shimmer className="w-40 h-5 mb-4" />
        <Shimmer className="w-full h-48 rounded-xl" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <Shimmer className="w-32 h-5" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}

// Member list skeleton
export function MemberListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Shimmer className="w-40 h-7" />
        <Shimmer className="w-64 h-10 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="px-6 py-3.5 flex items-center gap-4 border-b border-slate-50">
            <Shimmer className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Shimmer className="w-28 h-4" />
              <Shimmer className="w-40 h-3" />
            </div>
            <Shimmer className="w-16 h-5 rounded-full" />
            <Shimmer className="w-12 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Analytics skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Shimmer className="w-48 h-7" />
        <Shimmer className="w-64 h-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <Shimmer className="w-32 h-5 mb-4" />
          <Shimmer className="w-full h-56 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <Shimmer className="w-32 h-5 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="w-16 h-4 rounded-full" />
                <Shimmer className="flex-1 h-2 rounded-full" />
                <Shimmer className="w-8 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
