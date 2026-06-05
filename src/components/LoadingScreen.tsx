import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}

/**
 * Refined loading state — cream backdrop, Cinzel wordmark, three-dot bounce.
 * No pulsing logo image, no spinner ring. The mark IS the loader.
 */
export default function LoadingScreen({
  message = '',
  timeout = 30000,
  onTimeout,
}: LoadingScreenProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const t = setTimeout(() => {
        setTimedOut(true);
        onTimeout?.();
      }, timeout);
      return () => clearTimeout(t);
    }
  }, [timeout, onTimeout]);

  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4EDE2' }}>
        <div className="text-center max-w-sm">
          <h2
            className="text-[22px] font-semibold mb-3"
            style={{ fontFamily: "'Cinzel','Trajan Pro',serif", color: '#16291E', letterSpacing: '0.04em' }}
          >
            Taking a moment.
          </h2>
          <p className="text-[14px] text-slate-600 mb-6">
            Check your connection and we'll try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: '#16291E' }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4EDE2' }}>
      <div className="flex flex-col items-center">
        <h1
          className="text-[28px] sm:text-[34px] font-semibold uppercase select-none"
          style={{
            fontFamily: "'Cinzel','Trajan Pro',serif",
            color: '#16291E',
            letterSpacing: '0.22em',
          }}
        >
          Paddle&nbsp;Grid
        </h1>

        {/* Hairline beneath the wordmark — matches the logo's understated rule */}
        <div className="mt-3 h-px w-[160px] sm:w-[200px]" style={{ background: 'rgba(22,41,30,0.18)' }} />

        {/* Three-dot bounce — subtle, no spinner ring, no pulsing image */}
        <div className="mt-7 flex items-center gap-2" aria-label={message || 'Loading'}>
          <Dot delay="0s" />
          <Dot delay="0.18s" />
          <Dot delay="0.36s" />
        </div>

        {message ? (
          <p className="mt-5 text-[12px] tracking-[0.04em] uppercase text-slate-500 font-medium">
            {message}
          </p>
        ) : null}
      </div>

      <style>{`
        @keyframes pg-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30%           { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="block w-1.5 h-1.5 rounded-full"
      style={{
        background: '#16291E',
        animation: 'pg-bounce 1.1s ease-in-out infinite',
        animationDelay: delay,
      }}
    />
  );
}
