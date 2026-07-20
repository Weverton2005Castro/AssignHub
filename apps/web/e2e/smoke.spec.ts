import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('SubscriptionHub')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('lembrar');
});

test('login page renders form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
});
