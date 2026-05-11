import { useState, useCallback, createContext, useContext, useRef, useEffect, ReactNode } from 'react';

interface AnnounceContextType {
  announce: (message: string, assertive?: boolean) => void;
}

const AnnounceContext = createContext<AnnounceContextType | null>(null);

/**
 * Hook to announce messages to screen readers via aria-live regions.
 * @returns { announce } - Call announce(message) for polite, announce(message, true) for assertive.
 */
export function useAnnounce(): AnnounceContextType {
  const ctx = useContext(AnnounceContext);
  if (!ctx) {
    // Fallback no-op if used outside provider
    return { announce: () => {} };
  }
  return ctx;
}

interface A11yAnnouncerProviderProps {
  children: ReactNode;
}

/**
 * Provides a visually-hidden aria-live region that any child component
 * can post messages to via the useAnnounce() hook.
 */
export function A11yAnnouncerProvider({ children }: A11yAnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const politeTimeout = useRef<ReturnType<typeof setTimeout>>();
  const assertiveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string, assertive = false) => {
    if (assertive) {
      // Clear then set to force re-announcement of identical messages
      setAssertiveMessage('');
      clearTimeout(assertiveTimeout.current);
      assertiveTimeout.current = setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage('');
      clearTimeout(politeTimeout.current);
      politeTimeout.current = setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(politeTimeout.current);
      clearTimeout(assertiveTimeout.current);
    };
  }, []);

  const srOnlyStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  };

  return (
    <AnnounceContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" role="status" style={srOnlyStyle}>
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" role="alert" style={srOnlyStyle}>
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}
