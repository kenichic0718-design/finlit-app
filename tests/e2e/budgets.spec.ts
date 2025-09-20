import { test, expect } from '@playwright/test';
import { resetAndSeed, yyyymm } from './utils/seed';

test.beforeAll(async () => {
  await resetAndSeed();
});

test('予算を追加すると一覧に反映される', async ({ page }) => {
  await page.goto('/budgets');
  await page.waitForLoadState('networkidle');

  // 月は seed と同じ月（utils/seed の yyyymm）になっている想定
  // フォーム入力
  await page.getByLabel('カテゴリ').selectOption('娯楽');
  await page.getByLabel('金額（円）').fill('2000');
  await page.getByRole('button', { name: '追加' }).click();

  // 反映確認（行に娯楽 & 2,000円 相当が現れる）
  await expect(page.getByRole('table').getByText('娯楽')).toBeVisible();
  await expect(page.getByRole('table').getByText(/2,?000円/)).toBeVisible();
});
