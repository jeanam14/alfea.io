#!/usr/bin/env node
// Capture desktop + mobile screenshots of a page for human/visual review.
//
// Usage: node scripts/prospecting/screenshot-site.js <url> <out-prefix>
// Writes <out-prefix>-desktop.png and <out-prefix>-mobile.png.
//
// Uses the globally installed Playwright + pre-downloaded Chromium in this
// environment (no npm install needed here).

const path = require("path");
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

async function shoot(url, outPrefix) {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });

  for (const [label, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  })) {
    const page = await browser.newPage({ viewport });
    try {
      await page.goto(url, { waitUntil: "load", timeout: 20000 });
    } catch (e) {
      console.error(`  [${label}] navigation issue: ${e.message}`);
    }
    const outPath = `${outPrefix}-${label}.png`;
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`  [${label}] saved ${outPath}`);
    await page.close();
  }

  await browser.close();
}

async function main() {
  const [url, outPrefix] = process.argv.slice(2);
  if (!url || !outPrefix) {
    console.error("Usage: node screenshot-site.js <url> <out-prefix>");
    process.exit(1);
  }
  console.log(`Screenshotting ${url}`);
  await shoot(url, outPrefix);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
