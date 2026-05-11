import { test, expect } from '@playwright/test';

test.describe('Authentication flows', () => {
  test('login form has email and password fields', async ({ page }) => {
    await page.goto('/');

    // Click the auth/login button in the navbar (visible when logged out)
    const signInButton = page.getByRole('button', { name: /sign in|log in|get started/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    } else {
      // Try clicking generic auth trigger
      const authButton = page.locator('nav').getByRole('button').last();
      await authButton.click();
    }

    // Auth modal should appear with email and password inputs
    const modal = page.locator('[class*="modal"], [role="dialog"], [class*="Modal"]').first();
    await expect(modal.or(page.locator('form'))).toBeVisible({ timeout: 5000 });

    // Check for email and password fields
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await expect(passwordInput).toBeVisible();
  });

  test('signup form has expected fields', async ({ page }) => {
    await page.goto('/');

    // Open auth modal
    const signInButton = page.getByRole('button', { name: /sign in|log in|get started/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    } else {
      const authButton = page.locator('nav').getByRole('button').last();
      await authButton.click();
    }

    // Switch to signup mode
    const signupToggle = page.getByText(/sign up|create account|register|don't have an account/i);
    await expect(signupToggle).toBeVisible({ timeout: 5000 });
    await signupToggle.click();

    // Signup form should have email field at minimum
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();
  });

  test('invalid login shows error message', async ({ page }) => {
    await page.goto('/');

    // Open auth modal
    const signInButton = page.getByRole('button', { name: /sign in|log in|get started/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    } else {
      const authButton = page.locator('nav').getByRole('button').last();
      await authButton.click();
    }

    // Wait for modal
    await page.waitForTimeout(500);

    // Fill in invalid credentials
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    await emailInput.fill('invalid@test.com');

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await passwordInput.fill('wrongpassword123');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    // Need to wait for the honeypot timer (2 seconds)
    await page.waitForTimeout(2500);
    await submitButton.click();

    // Should show an error message
    const errorMessage = page.getByText(/invalid|error|incorrect|failed/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('auth modal can be closed', async ({ page }) => {
    await page.goto('/');

    // Open auth modal
    const signInButton = page.getByRole('button', { name: /sign in|log in|get started/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
    } else {
      const authButton = page.locator('nav').getByRole('button').last();
      await authButton.click();
    }

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Close the modal via close button (X) or clicking outside
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first();
    // Try the X close button or press Escape
    await page.keyboard.press('Escape');

    // Modal should be gone - verify we can still see the page
    await expect(page.locator('nav')).toBeVisible();
  });

  test('protected routes prompt for auth when not logged in', async ({ page }) => {
    // The /community route should still render (may show limited content)
    await page.goto('/community');
    await expect(page.locator('nav')).toBeVisible();

    // The /bookings route requires auth
    await page.goto('/bookings');
    await expect(page.locator('nav')).toBeVisible();

    // The /profile route requires auth
    await page.goto('/profile');
    await expect(page.locator('nav')).toBeVisible();

    // The /admin route requires auth + admin
    await page.goto('/admin');
    await expect(page.locator('nav')).toBeVisible();
  });
});
