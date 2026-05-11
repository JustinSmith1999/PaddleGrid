import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {
  test('homepage loads with key content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PaddleGrid/);
    // Navbar with logo should be visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByAlt('PaddleGrid Logo')).toBeVisible();
  });

  test('sales page loads', async ({ page }) => {
    await page.goto('/sales');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('nav')).toBeVisible();
    // Sales page should have facility-oriented content
    await expect(page.locator('body')).toContainText(/venue|facility|club|manage/i);
  });

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('body')).toContainText(/privacy/i);
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('body')).toContainText(/terms/i);
  });

  test('support page loads', async ({ page }) => {
    await page.goto('/support');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('body')).toContainText(/support|help|contact/i);
  });

  test('browse courts page loads', async ({ page }) => {
    await page.goto('/browse');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('series page loads', async ({ page }) => {
    await page.goto('/series');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('merch page loads', async ({ page }) => {
    await page.goto('/merch');
    await expect(page).toHaveTitle(/PaddleGrid/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('404 page for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.locator('body')).toContainText('404');
    await expect(page.locator('body')).toContainText(/not found/i);
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();

    // Navigate to privacy via direct URL, then back
    await page.goto('/privacy');
    await expect(page.locator('body')).toContainText(/privacy/i);

    await page.goto('/terms');
    await expect(page.locator('body')).toContainText(/terms/i);

    // Navigate back to home
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });
});
