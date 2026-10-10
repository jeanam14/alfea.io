# Kai reactivation + Booking system — prospecting handbook

Everything a new session needs to pick this work back up. No prospect names, emails or phones live in git — they live in the two Google Sheets below (source of truth). Last updated 2026-10-10.

## The two offers
- **Kai (lead reactivation)** — AI agent that re-contacts old/cold leads on WhatsApp/email/SMS/web chat and hands back the interested ones. Market: UAE. Sold to (1) agencies, for their own pipeline AND as something they offer their clients (not just a resell deal), and (2) direct niches sitting on paid-for, unclosed leads.
- **Booking system** — one booking link (services + prices + slots, pay on site, no online payment) built on Setmore/Koalendar, plus a simple website if they have none. 12,000–30,000 FCFA/month. Market: Dakar + Abidjan. Test both pitches: booking link vs "Kai books on WhatsApp".

## Where the data lives
| What | Where |
|---|---|
| Kai prospects (1 tab per niche: Agencies, Business setup, Mortgage brokers, Training, Real estate, Clinics, Already contacted) | Google Sheet "Kai reactivation - Prospects Claude" — id `1asS2DgDqfBCK879m9-c6iSb32Ihf7YJ-waz6WXat244` |
| Booking prospects (tabs: Dakar, Abidjan, Excluded, Comparison) | Google Sheet "Booking system - Prospects Claude" — id `1zPRyjIKhgVVomZz2Hn0mifcf_Fv_NF2wA28IrE1jfWw` |
| Sheets access | Service account `alfea-reactivation-booking@alfea-reactivation-booking.iam.gserviceaccount.com` (Editor on both sheets). Key in env `GOOGLE_SA_KEY_B64`. Token: `T=$(python3 scripts/prospecting/gsheets_token.py)`, then Sheets REST API v4 with `Authorization: Bearer $T`. |
| Local working CSVs (session-only, gitignored via `.git/info/exclude`) | `prospecting/offers/kai/`, `prospecting/offers/booking/` — rebuild from the sheets if missing |

Every prospect tab ends with `status, last_contact, notes, on_instantly`. `status/last_contact/notes` are for Jean + Babylyn. **Claude only maintains `on_instantly`** (campaign name, or empty if not uploaded).

## Instantly (via Composio Instantly connection)
| Campaign | ID | State |
|---|---|---|
| JEAN Reactivation (sales agency) UAE | `f2afc8ed-c6dc-46f5-97df-db06456a1d89` | **live** — agencies go here |
| JEAN Kai Reactivation (business setup) UAE | `28e6f9e4-5f0d-4b16-9844-85583b6f394b` | draft (Jean reviews + launches) |
| JEAN Kai Reactivation (mortgage brokers) UAE | `0a4a0031-82d6-468f-abbe-616a73b079d2` | draft |
| JEAN Kai Reactivation (training) UAE | `75266a1a-a340-40a1-9822-ce217948fe03` | draft |

Rules:
- **A niche that already has a campaign → add new prospects straight into it** (live or draft). Live = Jean approved it; leads go out per its settings. Never create a "v2" of an existing niche.
- **A niche with no campaign → create a new draft** (never activate; Jean launches). Copy settings from the sales agency campaign: both sender accounts, Asia/Dubai 09:00–18:00 Sun–Fri, 15/day, text-only, stop on reply. 4 steps (delays 2/3/3/4 days), **2 variants for email 1**.
- Copy learnings: in the sales agency campaign variant B ("Partnering with agencies like yours": short, about *their clients*, soft yes/no question) got 1 reply/11 vs A 0/12 (Leadee replied). New campaigns: variant B mirrors that format, variant A tries a niche-specific re-contact hook.
- Upload only Hunter-verified emails (`valid`; `accept_all` allowed but noted). Never upload emails on another company's domain. Use `skip_if_in_workspace: true`. Short brand names in `company_name` (it's used as `{{companyName}}`). Generic `info@` → `first_name: "team"`.
- After any upload, set `on_instantly` in the Kai sheet.
- Do not touch `1ee5daca-…` (website-redesign campaign, separate pipeline) or other existing campaigns.

## Already contacted (dedupe before any Kai outreach)
Instantly campaigns "JEAN Reactivation (sales agency) UAE" (23 original + 9 added 2026-10-10), "JEAN Partners UAE", "JEAN Marketing agencies collab", "UAE — Real Estate". The "Already contacted" tab in the Kai sheet lists them. Match on domain first, then normalised company name.

## Tools — order of use (free first, tell Jean before anything paid)
- **Google Maps listings:** Composio `COMPOSIO_SEARCH_GOOGLE_MAPS` (free, no auth) → HasData maps search → Firecrawl maps (low credits).
- **Website check (booking widget, prices, email):** Composio `COMPOSIO_SEARCH_FETCH_URL_CONTENT` (free; prefix `r.jina.ai/` when a site returns empty) → Firecrawl scrape.
- **Instagram:** HasData Google SERP light `site:instagram.com "<name>" <city>` (gl=sn/ci, hl=fr) to find the handle, then HasData Instagram profile for bio/link/followers. The free web search barely finds handles.
- **Emails (rotate):** Hunter email-finder first (55% hit on UAE SMBs; key injected by proxy, `curl https://api.hunter.io/v2/...`) → Lusha email reveal (good when it has one; never reveal phones = 5 credits) → Prospeo (0/9 on UAE SMBs, keep for larger firms). Verify with Hunter verifier before upload.
- **Not usable:** Apify (plan blocks public Actors), Outscraper (Jean: poor quality), Serper/Scrape.do (keys not reaching the proxy yet), Bright Data (no zone set up).
- Credits at 2026-10-10: Hunter ~21.5/50 (renews 11-09), Lusha 34/40, Prospeo 112, Firecrawl ~0.
- List building runs in **Sonnet subagents**; strategy/decisions stay in the main session.

## Booking — criteria and findings
- **Include:** ≥10 Google reviews AND (website but no online booking, OR no website and no booking link). WhatsApp click-to-chat ≠ booking. Exclude anyone with Fresha/Planity/Booksy/Setmore/SimplyBook/Koalendar/Calendly/AfriDoctor/custom booking page, incl. via Instagram bio.
- **Score:** round(10·log10(reviews+1)) + 10 premium area + 5 no website + 5 prices published. Premium: Dakar Almadies, Ngor, Mermoz, Point E, Plateau, Sacré-Cœur, Fann; Abidjan Cocody (Riviera, II Plateaux, Angré, Ambassades, Danga), Marcory Zone 4/Biétry, Plateau.
- **Findings (2026-10-10):** 363 prospects (Dakar 196, Abidjan 167). Hair/beauty salons = biggest pool, then gyms; barbers/nails cleanest (0% booking) but lowest ticket; spas/instituts = easy add-on (have sites). Yoga/pilates in Dakar already 20–33% online booking. Abidjan more open (0.7% booking, 71% no site) vs Dakar (5.8%, 56%). No Fresha/Planity presence seen in either city. Big Instagram accounts with no booking link (e.g. 15k–50k followers) → strong "link in bio" pitch. Only top 120 checked for Instagram so far.
- **Other markets:** Douala promising (63% no site, heavy Maps use, small Fresha foothold); Libreville needs more data; other cities unchecked.
- **Suggested first test:** 30 salons + 20 gyms per city, half pitched booking link + mini-site, half pitched Kai booking on WhatsApp.

## Kai — niche ranking (2026-10-10)
1. Business setup consultancies (most paid lead flow, WhatsApp-first, no AI competitor seen). 2. Mortgage brokers (clean "rates moved" / fixed-rate-ending hook). 3. Training institutes (big enquiry pools, intake hook, owners harder to reach). 4. Real estate (lots of leads but crowded with AI WhatsApp tools → better via agencies). 5. Clinics (hard to reach, patient-data friction).
Agencies: best fit = real-estate lead-gen/performance agencies (WGG, Kratos, Southmedia), then outsourced-sales shops using WhatsApp/CRM, then CRM partners. Competitors already selling AI reactivation: Leads Dubai, AirZep.

## Open items
- Jean to launch the 3 draft campaigns after review.
- 3 of the original 26 contacted agencies not found in Instantly.
- Real estate (1 new email: Espace) and Clinics (0) not enough for a campaign yet.
- Booking: Instagram check for rows beyond the top 120; ~35 sites unverifiable; 20 qualifiers without phone.
- Rotate the service-account key (it was pasted in chat once) — env var must hold the current key.
