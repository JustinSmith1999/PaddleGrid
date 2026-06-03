// Vercel Edge Middleware — gates the entire demo behind HTTP Basic Auth.
// Also neuters any cached service worker so previously-cached SWs uninstall.

export const config = {
      matcher: '/:path*',
};

function safeEqual(a: string, b: string): boolean {
      if (a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
      return diff === 0;
}

const KILL_SW = `// SW killswitch — self-unregisters and clears caches.
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
      const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
              await self.registration.unregister();
                  const clientList = await self.clients.matchAll({ type: 'window' });
                      for (const c of clientList) { try { c.navigate(c.url); } catch {} }
                        })());
                        });
                        self.addEventListener('fetch', () => {});
                        `;

export default function middleware(request: Request): Response | undefined {
      const url = new URL(request.url);

  if (url.pathname === '/service-worker.js' || url.pathname === '/sw.js') {
          return new Response(KILL_SW, {
                    status: 200,
                    headers: {
                                'Content-Type': 'application/javascript; charset=utf-8',
                                'Cache-Control': 'no-store, max-age=0',
                                'Service-Worker-Allowed': '/',
                    },
          });
  }

  const expectedUser = process.env.DEMO_AUTH_USER ?? '';
      const expectedPass = process.env.DEMO_AUTH_PASS ?? '';
      if (!expectedUser || !expectedPass) {
              return new Response('Demo authentication not configured', { status: 503 });
      }

  const auth = request.headers.get('authorization');
      if (!auth || !auth.startsWith('Basic ')) return unauthorized();

  let username = '', password = '';
      try {
              const decoded = atob(auth.slice(6).trim());
              const idx = decoded.indexOf(':');
              if (idx < 0) return unauthorized();
              username = decoded.slice(0, idx);
              password = decoded.slice(idx + 1);
      } catch { return unauthorized(); }

  if (!safeEqual(username, expectedUser) || !safeEqual(password, expectedPass)) return unauthorized();
      return undefined;
}

function unauthorized(): Response {
      return new Response('Authentication required', {
              status: 401,
              headers: {
                        'WWW-Authenticate': 'Basic realm="PaddleGrid Investor Preview", charset="UTF-8"',
                        'Cache-Control': 'no-store',
              },
      });
}
