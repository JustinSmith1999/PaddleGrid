export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }

  localStorage.clear();
  sessionStorage.clear();

  window.location.reload();
}

export function checkForUpdates(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.update();
      }
    });
  }
}

export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '2.0.0';
}

export function isNewVersionAvailable(): boolean {
  const currentVersion = getAppVersion();
  const storedVersion = localStorage.getItem('app_version');

  if (!storedVersion) {
    localStorage.setItem('app_version', currentVersion);
    return false;
  }

  if (storedVersion !== currentVersion) {
    localStorage.setItem('app_version', currentVersion);
    return true;
  }

  return false;
}
