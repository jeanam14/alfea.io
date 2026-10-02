# Tokens used by this template

When a new site is built from `templates/trades`, every `{{TOKEN}}` below gets
replaced with real content for that business. This file is the checklist used
during the content-swap pass — nothing else in `index.html` should be edited
structurally per client, only these values.

| Token | Example |
|---|---|
| `{{BUSINESS_NAME}}` | Rivera Plumbing Co |
| `{{TAGLINE}}` | Fast, honest plumbing for Austin homes |
| `{{HERO_SUBTEXT}}` | One-line supporting sentence under the tagline |
| `{{PHONE}}` | (512) 555-0134 |
| `{{PHONE_HREF}}` | 5125550134 |
| `{{WHATSAPP_NUMBER}}` | 15125550134 (digits only, no +, used in the sticky `wa.me/` button — omit if the business doesn't use WhatsApp) |
| `{{EMAIL}}` | contact@riveraplumbing.com |
| `{{ADDRESS}}` | 123 Main St, Austin, TX |
| `{{CITY}}` | Austin |
| `{{SERVICE_AREA}}` | Austin &amp; the surrounding Tri-County area |
| `{{RATING}}` | 4.8 |
| `{{REVIEW_COUNT}}` | 62 |
| `{{PRIMARY_COLOR}}` / `{{PRIMARY_COLOR_DARK}}` | #1D6F5C / #14503F |
| `{{HERO_IMAGE}}` / `{{ABOUT_IMAGE}}` | Real photo URL (Google Places photo, a real customer/review photo, or AI-generated as a last resort) |
| `{{SERVICES_INTRO}}` | One sentence introducing the services grid |
| `{{SERVICE_1..6_NAME}}` / `{{SERVICE_1..6_DESC}}` | e.g. "Emergency Repairs" / one-line description |
| `{{ABOUT_HEADLINE}}` / `{{ABOUT_TEXT}}` | Short "why us" section |
| `{{REVIEW_1..3_TEXT}}` / `{{REVIEW_1..3_AUTHOR}}` | Pulled from Google reviews |
| `{{MAP_EMBED_SRC}}` | `https://www.google.com/maps/embed?...` for their address |
| `{{YEAR}}` | Current year, for the footer |

Fewer than 6 real services? Delete the unused service cards rather than
leaving a token unfilled — a leftover `{{TOKEN}}` on the live page is the one
mistake that must never ship.

Never fabricate a number the business can't back up (years in business,
"jobs completed," "licensed & insured") — real Google rating/review count
are the only aggregate figures this template shows, and only once, in the
hero badge. An earlier version of this template also had a floating
"years serving" hero card, a trust marquee, a "Recent work" photo gallery,
and a reviews marquee repeating the rating/count — all removed after
building the real al-naveed-ac site: the AI-generated gallery photos read
as fake rather than building trust, and repeating the rating/review count
everywhere read as oversold (it's also the one fact on the page most likely
to go stale, since it's scraped from a live Google listing). If a review
has fewer than 3 genuinely distinct real reviews to show, don't invent the
rest — cut the reviews section down to however many are real (even one).
