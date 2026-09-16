# Tokens used by this template

When to reach for this template: a prospect that sells physical products and
whose site should let visitors actually browse and buy — a trading/wholesale
company, a parts supplier, a retailer — the same shape as the Power Cool
build this template was extracted from. It is not the default for every new
prospect; a service business (salon, clinic, agency, contractor) with no
product catalog should get a different template or a bespoke build instead.
Pick deliberately per prospect (see the note in the repo README).

Every `{{TOKEN}}` below appears in both `index.html` and `shop.html` and gets
replaced with real content for that business. This file is the checklist
used during the content-swap pass.

| Token | Example |
|---|---|
| `{{BUSINESS_NAME}}` | Power Cool AC Spare Parts |
| `{{BUSINESS_TYPE_LINE}}` | AC Spare Parts · Dubai |
| `{{TAGLINE}}` | Genuine AC spare parts, in stock and ready to ship across Dubai |
| `{{HERO_SUBTEXT}}` | One-line supporting sentence under the tagline |
| `{{META_DESCRIPTION}}` | One-sentence SEO description for `<meta name="description">` |
| `{{PRIMARY_COLOR}}` / `{{PRIMARY_COLOR_DARK}}` | #2856F2 / #1B3EC2 |
| `{{PHONE}}` | +971 50 356 3100 |
| `{{PHONE_HREF}}` | +971503563100 (used in `tel:` links — digits and leading + only) |
| `{{WHATSAPP_NUMBER}}` | 971508854100 (digits only, no +, used in `wa.me/` links) |
| `{{EMAIL}}` | info@example.com |
| `{{ADDRESS}}` | Fish Roundabout, Al Rigga, Deira, Dubai, UAE |
| `{{CITY}}` | Dubai |
| `{{HOURS}}` | Open daily · Closes 9 PM |
| `{{RATING}}` | 4.1 |
| `{{REVIEW_COUNT}}` | 158 |
| `{{BRAND_COUNT}}` | Number of brands listed in the BRANDS array (see below) |
| `{{DELIVERY_TIME}}` / `{{DELIVERY_LABEL}}` | 24h / Dubai delivery |
| `{{DELIVERY_FEE}}` | 25 — a bare number, no currency code, used inside JS arithmetic |
| `{{BASE_CURRENCY}}` | AED — the business's home currency. Appears as a bare object key in `js/app.js`, so it must be a valid 3-letter currency code |
| `{{CATEGORIES_EYEBROW}}` | In Stock · Dubai |
| `{{BRANDS_EYEBROW}}` | Authorized Stockist |
| `{{ABOUT_HEADLINE}}` / `{{ABOUT_TEXT}}` | Short "why us" section |
| `{{FOOTER_ABOUT_TEXT}}` | 2-3 sentence footer description of the business |
| `{{REVIEW_1_TEXT}}` / `{{REVIEW_1_AUTHOR}}` | Pulled from a real Google review |
| `{{REVIEW_2_TEXT}}` / `{{REVIEW_2_AUTHOR}}` | Pulled from a real Google review |
| `{{MAP_EMBED_SRC}}` | `https://www.google.com/maps/embed?...` or `https://www.google.com/maps?q=...&output=embed` for their address |
| `{{YEAR}}` | Current year, for the footer |

## Not a token: the product catalog

`BRANDS`, `CATEGORY_META` and `PRODUCTS` in `js/app.js` are **not** tokens —
delete the sample entries and write the real catalog directly as JS. A
product catalog's shape (which specs matter, how many categories, how many
brands) is different for every business; token substitution doesn't fit it.
The sample data is clearly fake (`Sample Brand One`, `Sample Product Two`,
`SKU-0001`) specifically so a leftover sample entry is obvious if it ever
slips through — treat any surviving sample as a shipping blocker, same as a
leftover `{{TOKEN}}`.

While editing the catalog: `CATEGORY_META` keys must exactly match the
`category` field used in `PRODUCTS` (case-sensitive) — that's what makes the
homepage's category tiles deep-link into `shop.html?category=...` correctly,
and what the shop page's category pills and sidebar filter list are built
from.

## If the business isn't priced in AED

The currency selector ships pre-wired for a UAE business (`{{BASE_CURRENCY}}`
= AED, with USD/EUR/GBP as alternates). If the real base currency is one of
USD, EUR or GBP, you'll have a duplicate entry after substitution — remove
it from `CURRENCY_RATES` and `CURRENCY_SYMBOLS` in `js/app.js`, and remove
the matching duplicate `<option>` from the currency `<select>` in both
`index.html` and `shop.html`. Also update the illustrative conversion rates
in `CURRENCY_RATES` if the base currency changes — they're hand-set relative
to AED and will be wrong relative to a different base.

## Images

Edit `assets-manifest.txt` with real prompts (or real photo URLs, editing
the `<img src>` tags directly instead) before running
`.github/workflows/generate-assets.yml` for this site. The manifest ships
with one hero, one about, and one image per sample product — add or remove
product image lines to match the real catalog size.

Fewer real reviews than the template has cards for? Delete the extra review
card rather than leave a token unfilled — a leftover `{{TOKEN}}` on the live
page is the one mistake that must never ship (alongside a leftover sample
product, per above).
