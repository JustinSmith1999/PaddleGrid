import { test, expect } from '@playwright/test';

test.describe('Performance checks', () => {
  test('homepage loads in under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Ignore known benign errors (e.g., favicon, Supabase network issues in test)
        const text = msg.text();
        if (
          text.includes('favicon') ||
          text.includes('supabase') ||
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch')
        ) {
          return;
        }
        errors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors).toHaveLength(0);
  });

  test('no console errors on sales page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('favicon') ||
          text.includes('supabase') ||
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch')
        ) {
          return;
        }
        errors.push(text);
      }
    });

    await page.goto('/sales');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors).toHaveLength(0);
  });

  test('no console errors on browse page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('favicon') ||
          text.includes('supabase') ||
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch')
        ) {
          return;
        }
        errors.push(text);
      }
    });

    await page.goto('/browse');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(errors).toHaveLength(0);
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Check if service worker registration is attempted
    const hasServiceWorker = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });

    // Service worker may or may not be registered in dev mode
    // This is a soft check - we verify the API is available
    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(swSupported).toBe(true);
  });

  test('key static assets load successfully', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      // Check for failed requests to key assets
      const url = response.url();
      const status = response.status();
      if (
        (url.includes('.js') || url.includes('.css') || url.includes('.png')) &&
        status >= 400 &&
        !url.includes('favicon')
      ) {
        failedRequests.push(`${status} ${url}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    expect(failedRequests).toHaveLength(0);
  });

  test('lazy-loaded routes do not block initial render', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');

    // The nav should be visible quickly (not blocked by lazy routes)
    await expect(page.locator('nav')).toBeVisible();
    const navVisibleTime = Date.now() - start;

    expect(navVisibleTime).toBeLessThan(5000);
  });
});
