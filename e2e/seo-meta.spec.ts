import { test, expect } from '@playwright/test';

test.describe('SEO and meta tags', () => {
  test('homepage has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PaddleGrid/);
  });

  test('homepage has meta description', async ({ page }) => {
    await page.goto('/');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.+/);
  });

  test('homepage has OG title tag', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /PaddleGrid/);
  });

  test('homepage has OG description tag', async ({ page }) => {
    await page.goto('/');
    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute('content', /.+/);
  });

  test('homepage has OG image tag', async ({ page }) => {
    await page.goto('/');
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /.+/);
  });

  test('homepage has twitter card meta tags', async ({ page }) => {
    await page.goto('/');
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', /.+/);

    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toHaveAttribute('content', /PaddleGrid/);
  });

  test('homepage has theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', /.+/);
  });

  test('homepage has viewport meta tag', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('homepage has lang attribute on html', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('pages maintain title across navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PaddleGrid/);

    await page.goto('/browse');
    await expect(page).toHaveTitle(/PaddleGrid/);

    await page.goto('/privacy');
    await expect(page).toHaveTitle(/PaddleGrid/);
  });

  test('manifest link is present', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', /manifest/);
  });

  test('apple-touch-icon is present', async ({ page }) => {
    await page.goto('/');
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveAttribute('href', /.+/);
  });
});
