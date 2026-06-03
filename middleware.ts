// Vercel Edge Middleware — gates the entire demo behind HTTP Basic Auth.
// Place this file at the ROOT of the PaddleGrid repo (same level as package.json).
// Configure DEMO_AUTH_USER and DEMO_AUTH_PASS as Environment Variables in the
// Vercel project (paddlegrid-demo only — do NOT add these to prod).
//
// To remove the gate later: delete this file and redeploy.

export const config = {
    matcher: '/:path*',
};

function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
          diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

export default function middleware(request: Request): Response | undefined {
    const expectedUser = process.env.DEMO_AUTH_USER ?? '';
    const expectedPass = process.env.DEMO_AUTH_PASS ?? '';

  if (!expectedUser || !expectedPass) {
        return new Response('Demo authentication not configured', { status: 503 });
  }

  const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Basic ')) {
          return unauthorized();
    }

  let username = '';
    let password = '';
    try {
          const decoded = atob(auth.slice(6).trim());
          const idx = decoded.indexOf(':');
          if (idx < 0) return unauthorized();
          username = decoded.slice(0, idx);
          password = decoded.slice(idx + 1);
    } catch {
          return unauthorized();
    }

  if (!safeEqual(username, expectedUser) || !safeEqual(password, expectedPass)) {
        return unauthorized();
  }

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

// trigger redeploy
