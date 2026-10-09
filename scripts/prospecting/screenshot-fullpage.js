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
  await page.waitForTimeout(1500);
  // Scroll through the whole page first so any scroll-triggered reveal
  // animations (IntersectionObserver fade-ins, sticky-nav class toggles)
  // have actually fired before the full-page capture - otherwise sections
  // that never entered the viewport during a plain goto+screenshot stay
  // at their initial (often invisible) state and the screenshot shows
  // blank gaps that don't reflect what a real visitor sees.
  await page.evaluate(async () => {
    // Sites set `scroll-behavior: smooth`; force instant jumps so the final
    // scroll back to the top has finished before capture (otherwise a sticky
    // nav gets captured mid-page, overlapping the hero).
    document.documentElement.style.scrollBehavior = "auto";
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    const scrollHeight = document.documentElement.scrollHeight;
    for (let y = 0; y < scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath, fullPage: true, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPath}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
