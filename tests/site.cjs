const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createServer } = require('../scripts/serve.cjs');
const { launchBrowser, reportPath } = require('./helpers.cjs');

(async () => {
  const browser = await launchBrowser();
  const results = [];
  try {
    for (const basePath of ['/', '/rainy-convenience-store/']) {
      const server = createServer({ basePath });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      const origin = `http://127.0.0.1:${server.address().port}`;
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const errors = [], failed = [], external = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('requestfailed', r => failed.push(r.url()));
      page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
      page.on('request', r => { if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== origin) external.push(r.url()); });
      try {
        const started = Date.now();
        await page.goto(origin + basePath);
        await page.waitForFunction(() => window.__district?.ready || window.__districtError, {}, { timeout: 120000 });
        assert.equal(await page.evaluate(() => window.__districtError), undefined);
        const state = await page.evaluate(() => ({ view: __district.view, quality: __district.quality, inventory: __district.inventory, street: __district.street }));
        assert.equal(state.view, 'street');
        assert.equal(state.quality.mode, 'high-realtime');
        assert(state.inventory.items > 400 && state.inventory.categories.includes('日用品'));
        assert.equal(state.street.lamps, 6);
        assert.equal(await page.locator('#quality').count(), 0);
        await page.evaluate(() => { __district.setPaused(true); __district.setTime(17); __district.selectView('interior', true); });
        assert(await page.evaluate(() => __district.roofOpen));
        await page.waitForTimeout(500);
        await page.screenshot({ path: reportPath(basePath === '/' ? 'site-interior.png' : 'pages-interior.png') });
        await page.evaluate(() => __district.selectView('street', true));
        const before = await page.evaluate(() => __district.controls.getAzimuthalAngle());
        await page.mouse.move(820, 450); await page.mouse.down();
        await page.mouse.move(960, 470, { steps: 10 }); await page.mouse.up();
        await page.waitForTimeout(350);
        assert(Math.abs(await page.evaluate(() => __district.controls.getAzimuthalAngle()) - before) > .04);
        assert.deepEqual(errors, []); assert.deepEqual(failed, []); assert.deepEqual(external, []);
        results.push({ basePath, elapsedMs: Date.now() - started, state, errors, failed, external });
      } finally {
        await page.close();
        await new Promise(resolve => server.close(resolve));
      }
    }
    const offline = path.resolve(__dirname, '../dist/rainy-corner.html');
    if (fs.existsSync(offline)) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
      const network = [], errors = [];
      page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(pathToFileURL(offline).href);
      await page.waitForFunction(() => window.__district?.ready || window.__districtError, {}, { timeout: 120000 });
      assert.equal(await page.evaluate(() => window.__districtError), undefined);
      assert.deepEqual(network, []); assert.deepEqual(errors, []);
      results.push({ offline: true, network, errors });
      await page.close();
    }
    fs.writeFileSync(reportPath('site-report.json'), JSON.stringify(results, null, 2));
    console.log('Website root, GitHub Pages subdirectory, assets and controls passed.');
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
