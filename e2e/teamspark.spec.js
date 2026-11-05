/**
 * TeamSpark - browser (UI) test cases, Playwright. Real Chromium, real clicks and typing.
 * Title format: UI-xx | SRS requirement | Module | what is tested | Expected: result
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');

test.beforeEach(async ({ page }) => { await page.goto(URL); });

const tab = (page, n) => page.locator(`.tab[data-tab="${n}"]`).click();
const card = (page, t) => page.locator('.card', { hasText: t });
async function create(page, title, skills) {
  await tab(page, 'create');
  await page.fill('#f-title', title);
  await page.fill('#f-desc', 'Test description');
  await page.fill('#f-skills', skills);
  await page.click('text=Post listing');
}

test('UI-01 | REQ-TS-06 | Search | type "python" in the search box, then type "cobol" | Expected: only ML Study Recommender for python; "No listings match" message for cobol', async ({ page }) => {
  await expect(page.locator('.card')).toHaveCount(4);
  await page.fill('#search', 'python');
  await expect(page.locator('.card')).toHaveCount(1);
  await expect(card(page, 'ML Study Recommender')).toBeVisible();
  await page.fill('#search', 'cobol');
  await expect(page.locator('.empty')).toContainText('No listings match');
});

test('UI-02 | REQ-TS-04 | Create listing | fill the form and click Post listing; then submit with an empty title | Expected: new listing appears in Browse (5 teams); empty title shows an error and adds nothing', async ({ page }) => {
  await create(page, 'Hack Planner', 'React, Python');
  await expect(page.locator('.card')).toHaveCount(5);
  await expect(card(page, 'Hack Planner')).toBeVisible();
  await tab(page, 'create');
  await page.fill('#f-skills', 'react');
  await page.click('text=Post listing');
  await expect(page.locator('#listing-error')).toBeVisible();
});

test('UI-03 | REQ-TS-08, 09 | Access rules | open your own listing, then another student\'s listing | Expected: your listing shows only "Find suggested candidates"; the other shows only "Apply to join"', async ({ page }) => {
  await card(page, 'Peer Code Review Tool').click();
  await expect(page.locator('text=Find suggested candidates')).toBeVisible();
  await expect(page.locator('text=Apply to join')).toHaveCount(0);
  await page.click('.panel-close');
  await card(page, 'Smart Attendance App').click();
  await expect(page.locator('button', { hasText: 'Apply to join' })).toBeVisible();
  await expect(page.locator('text=Find suggested candidates')).toHaveCount(0);
});

test('UI-04 | REQ-TS-08 | Suggested candidates | post a listing needing react, node.js, mongodb; open it and click Find suggested candidates; invite the first candidate | Expected: 3 candidates, Arjun Rao first with 89%; Invite button turns into disabled "Invited"', async ({ page }) => {
  await create(page, 'My Attendance Clone', 'react, node.js, mongodb');
  await card(page, 'My Attendance Clone').click();
  await page.click('text=Find suggested candidates');
  await expect(page.locator('.cand')).toHaveCount(3);
  await expect(page.locator('.cand').first()).toContainText('Arjun Rao');
  await expect(page.locator('.cand').first()).toContainText('89%');
  const invite = page.locator('.cand').first().locator('button');
  await invite.click();
  await expect(page.locator('.cand').first().locator('button')).toBeDisabled();
  await expect(page.locator('.cand').first().locator('button')).toHaveText('Invited');
});

test('UI-05 | REQ-TS-09 | Join request | open Smart Attendance App and click Apply to join; then open the same listing again | Expected: Requests page shows the application as Pending; reopening the listing shows a disabled "Request sent" button', async ({ page }) => {
  await card(page, 'Smart Attendance App').click();
  await page.click('text=Apply to join');
  await expect(page.locator('#req-sent')).toContainText('Smart Attendance App');
  await expect(page.locator('#req-sent .badge-pending')).toHaveCount(2);
  await tab(page, 'browse');
  await card(page, 'Smart Attendance App').click();
  await expect(page.locator('button', { hasText: 'Request sent' })).toBeDisabled();
});

test('UI-06 | REQ-TS-05 | Delete listing | click Delete on your own listing twice | Expected: first click asks "Click again to confirm"; second click removes the listing (3 teams left)', async ({ page }) => {
  const del = page.locator('#del-4');
  await del.click();
  await expect(del).toHaveText('Click again to confirm');
  await del.click();
  await expect(page.locator('.card')).toHaveCount(3);
  await expect(card(page, 'Peer Code Review Tool')).toHaveCount(0);
});

test('UI-07 | NFR-TS-09 | Mobile layout | open the site at phone width (375 x 700 px) | Expected: listings visible and the page does not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await expect(page.locator('.card').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});
