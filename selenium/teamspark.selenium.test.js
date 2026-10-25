// Selenium WebDriver browser tests for TeamSpark.
// Run: npm run test:selenium   (needs Chrome and a matching ChromeDriver on PATH)
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const PAGE = 'file://' + path.resolve(__dirname, '..', fs.existsSync(path.resolve(__dirname, '..', 'index.html')) ? 'index.html' : 'teamspark.html');
const CHROME_BIN = ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
jest.setTimeout(60000);

let driver;
beforeEach(async () => {
  const opts = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--window-size=1280,900');
  if (CHROME_BIN) opts.setChromeBinaryPath(CHROME_BIN);
  const service = new chrome.ServiceBuilder().addArguments('--disable-build-check');
  driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).setChromeService(service).build();
  await driver.get(PAGE);
  await driver.executeScript('localStorage.clear()');
  await driver.navigate().refresh();
});
afterEach(async () => { if (driver) await driver.quit(); });

async function openCard(title) {
  const el = await driver.findElement(By.xpath(`//div[contains(@class,'card')]//h3[normalize-space()='${title}']`));
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'})", el);
  await driver.sleep(300);
  await el.click();
}
const cards = () => driver.findElements(By.css('.card'));

test('SEL-01 | REQ-TS-06 | Search | type "python" then "cobol" in the search box | Expected: 1 card for python; "No listings match" for cobol', async () => {
  const box = await driver.findElement(By.id('search'));
  await box.sendKeys('python');
  assert.strictEqual((await cards()).length, 1);
  await box.clear();
  await box.sendKeys('cobol');
  assert.strictEqual((await cards()).length, 0);
  assert.ok((await driver.findElement(By.css('.empty')).getText()).includes('No listings match'));
});

test('SEL-02 | REQ-TS-04 | Create listing | fill the form and click Post listing | Expected: new listing appears (5 teams); empty title shows an error', async () => {
  await driver.findElement(By.css('.tab[data-tab="create"]')).click();
  await driver.findElement(By.id('f-title')).sendKeys('Selenium Demo Team');
  await driver.findElement(By.id('f-skills')).sendKeys('react, node.js');
  await driver.findElement(By.xpath("//button[normalize-space()='Post listing']")).click();
  assert.strictEqual((await cards()).length, 5);
  assert.ok((await driver.findElement(By.id('grid')).getText()).includes('Selenium Demo Team'));
  await driver.findElement(By.css('.tab[data-tab="create"]')).click();
  await driver.findElement(By.xpath("//button[normalize-space()='Post listing']")).click();
  const err = await driver.findElement(By.id('listing-error'));
  assert.ok(await err.isDisplayed());
});

test('SEL-03 | REQ-TS-08, 09 | Access rules | open your own listing, then another student\'s | Expected: own listing offers "Find suggested candidates"; the other offers "Apply to join"', async () => {
  await openCard('Peer Code Review Tool');
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space()='Find suggested candidates']")), 5000);
  assert.strictEqual((await driver.findElements(By.xpath("//button[normalize-space()='Apply to join']"))).length, 0);
  await driver.findElement(By.css('.panel-close')).click();
  await driver.sleep(300);
  await openCard('Smart Attendance App');
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space()='Apply to join']")), 5000);
  assert.strictEqual((await driver.findElements(By.xpath("//button[normalize-space()='Find suggested candidates']"))).length, 0);
});
