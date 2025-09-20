import { defineConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

// .env.test.local を読み込む（存在するときだけ）
const envFile = path.resolve(process.cwd(), '.env.test.local');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    // devサーバーを別ターミナルで起動する前提
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  // 失敗したときのリトライ（任意）
  retries: 0
});
