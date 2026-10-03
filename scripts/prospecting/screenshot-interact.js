#!/usr/bin/env node
// Verify real interactivity on a design preview page by actually clicking
// an issue/need chip and dragging the before/after slider, capturing
// before-and-after screenshots of each so the interaction can be checked
// without opening the live Design canvas.
//
// Usage: node screenshot-interact.js <url> <out-prefix>
// Writes: <out-prefix>-full.jpg, <out-prefix>-diagnose-before.jpg,
// <out-prefix>-diagnose-after.jpg, <out-prefix>-slider-before.jpg,
// <out-prefix>-slider-after.jpg

const { chromium } = require("playwright");

async function main() {
  const [url, outPrefix] = process.argv.slice(2);
  if (!url || !outPrefix) {
    console.error("Usage: node screenshot-interact.js <url> <out-prefix>");
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${outPrefix}-full.jpg`, fullPage: true, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPrefix}-full.jpg`);

  const diagnose = page.locator("#diagnose");
  await diagnose.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await diagnose.screenshot({ path: `${outPrefix}-diagnose-before.jpg`, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPrefix}-diagnose-before.jpg`);

  const chips = diagnose.locator("button");
  const count = await chips.count();
  if (count < 3) throw new Error(`Expected at least 3 chip buttons, found ${count}`);
  await chips.nth(2).click();
  await page.waitForTimeout(300);
  await diagnose.screenshot({ path: `${outPrefix}-diagnose-after.jpg`, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPrefix}-diagnose-after.jpg (clicked chip: "${await chips.nth(2).textContent()}")`);

  const sliderSection = page.locator("#slider-input").locator("xpath=ancestor::section[1]");
  await sliderSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await sliderSection.screenshot({ path: `${outPrefix}-slider-before.jpg`, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPrefix}-slider-before.jpg`);

  const slider = page.locator("#slider-input");
  await slider.evaluate((el) => {
    el.value = "85";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  await sliderSection.screenshot({ path: `${outPrefix}-slider-after.jpg`, type: "jpeg", quality: 82 });
  console.log(`Saved ${outPrefix}-slider-after.jpg`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
