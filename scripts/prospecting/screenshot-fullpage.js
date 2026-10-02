#!/usr/bin/env node
// Capture a full-page desktop screenshot of a page for visual review.
//
// Usage: node scripts/prospecting/screenshot-fullpage.js <url> <out-path>
//
// Unlike screenshot-site.js (viewport-only, used for prospect vision
// scoring), this captures the entire scrollable page - for verifying a
// design end-to-end rather than just the first fold. Requires playwright +
// Chromium, same as screenshot-site.js.

const { chromium } = require("playwright");

async function main() {
  const [url, outPath] = process.argv.slice(2);
  if (!url || !outPath) {
    console.error("Usage: node screenshot-fullpage.js <url> <out-path>");
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log(`Screenshotting ${url} (full page)`);
  await page.goto(url, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: outPath, fullPage: true, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPath}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
