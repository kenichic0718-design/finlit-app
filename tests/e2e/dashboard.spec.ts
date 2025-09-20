import { test, expect } from '@playwright/test';
import { resetAndSeed, yyyymm } from './utils/seed';

test.beforeAll(async () => {
  await resetAndSeed();
});

test('ダッシュボードが期待の要素を表示する', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // 見出し
  await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();

  // 月表示（ボタン or 期間テキスト）
  const y = yyyymm.slice(0, 4);
  const mNum = Number(yyyymm.slice(4, 6));
  const m2   = String(mNum).padStart(2, '0');
  const reMonthBtn = new RegExp(`${y}年\\s*0?${mNum}月`);
  const rePeriod   = new RegExp(`期間:\\s*${y}-${m2}-01`);

  await expect(
    page.getByRole('button', { name: reMonthBtn })
      .or(page.getByText(reMonthBtn))
      .or(page.getByText(rePeriod))
  ).toBeVisible({ timeout: 7000 });

  // テーブル
  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  // カラム見出し（セル扱いで確認）
  await expect(table.getByRole('cell', { name: 'カテゴリ', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: '予算', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: '実績', exact: true })).toBeVisible();

  // データ行が1行以上ある（ヘッダを除く）
  const rows = table.getByRole('row');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(1);

  // 金額っぽいセル（半角/全角数字・カンマ・マイナス・ピリオド等）を少なくとも1つ確認
  const amountLikeCell = table
    .getByRole('cell')
    .filter({ hasText: /[0-9０-９,\-\.]+/ });
  await expect(amountLikeCell.first()).toBeVisible({ timeout: 7000 });
});
