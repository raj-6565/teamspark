const { defineConfig } = require('@playwright/test');
const fs = require('fs');
// Uses the Chromium that Playwright installs by default; falls back to a system path if present.
const sys = '/opt/pw-browsers/chromium';
module.exports = defineConfig({
  testDir: './e2e',
  reporter: [['list'], ['json', { outputFile: 'e2e-results.json' }]],
  use: {
    headless: true,
    launchOptions: fs.existsSync(sys) ? { executablePath: sys } : {},
  },
});
