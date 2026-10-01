#!/usr/bin/env node
// Capture desktop + mobile screenshots of a page for human/visual review.
//
// Usage: node scripts/prospecting/screenshot-site.js <url> <out-prefix>
// Writes <out-prefix>-desktop.jpg and <out-prefix>-mobile.jpg.
//
// JPEG, not PNG: these get committed to the repo and fetched back one file
// at a time via the GitHub API, which fails outright above 1MB with no
// fallback available in that session - a full-viewport PNG screenshot
// routinely exceeds that, a JPEG at quality 82 essentially never does.
//
// Requires `playwright` + its Chromium build to be installed wherever this
// runs (`npm install playwright && npx playwright install --with-deps
// chromium`) - this targets a GitHub Actions runner, not the Claude Code
// sandbox, since prospect sites are arbitrary external domains the sandbox's
// network policy blocks.

const { chromium } = require("playwright");

async function shoot(url, outPrefix) {
  const browser = await chromium.launch();

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
    const outPath = `${outPrefix}-${label}.jpg`;
    await page.screenshot({ path: outPath, fullPage: false, type: "jpeg", quality: 82 });
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
