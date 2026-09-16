import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'websocket.spec.ts',
  timeout: 15000,
  workers: 1,
  reporter: 'list',
  use: { headless: true },
});
