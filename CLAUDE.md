# Alfea prospecting pipeline — standing rules

Read this file instead of re-stating these rules in the hourly trigger prompt. The trigger prompt only carries what changes run to run (which steps, any one-off notes); everything durable lives here.

## References
- Prospect Triage artifact: https://claude.ai/artifact/1g9H5nGJ8SGNpgxaNBf9jc
- Instantly campaign id: `1ee5daca-007d-4684-8cc2-c86e26942eb1` (stays draft, never activate)
- Working branch: `claude/agency-website-scale-bat25b`
- Tracker Sheet: spreadsheet_id `1KInZLwAqjM_TlJMtCAcgRYJ5Ma3aUIDCu3TIQPWg2F4`

## Every firing (Step A + Instantly reconciliation)
- **Step A**: build sites for `jeanReview` outdated/mid prospects with no `siteStatus` yet. Cap 5 per firing — if more candidates exist, do up to 5 well and leave the rest for next firing. Every build also sets a `flaw` field on the doc: the single specific problem found on their old site, written in second person ("your site's..."), one sentence — this is what Instantly personalizes the outreach email with ({{flaw}}). Missing it is a real gap (caught 2026-10-06 on 3 leads pushed before this field existed) — never leave it unset on an approved doc.
- **Instantly push is no longer Claude's job.** `scripts/prospecting/push_instantly_leads.py`, run on its own GitHub Actions schedule (`push-instantly-leads.yml`, every 15 min), reads the Tracker Sheet directly and pushes approved+emailed prospects to Instantly via its API — no LLM involved. Claude's only remaining role: read `prospecting/instantly-pushed.json` (the ledger that script commits) and set `instantlyLeadAdded: true` on any artifact doc whose email appears there and isn't already marked. Do this reconciliation once per firing, cheaply (it's a plain read + a couple of targeted writes, not a bulk/batch write).
- Re-check `changes-requested` prospects: if a fix has already been pushed since last review, clear `siteComment` and update `siteStatus`/`siteScreenshotUrl` in the same turn as the fix — never leave Jean looking at a stale complaint.
- **Email mismatch guard**: when recording a `contactEmail` that's known to belong to a different business than the one being built for (see caution-on-found-emails below), also set `emailMismatchFlag: true` on the doc. The Tracker Sheet sync passes this through as `email_flagged`, and the standalone push script skips any row flagged this way — it never auto-pushes a mismatched email. Flag it to Jean in the same turn instead.

## Visual/content standing bar (all apply to every new build and every touch of an existing site)
- **Glass effects**: frosted/translucent panels, backdrop-blur, layered depth — nav as a floating frosted panel (`rgba(...)` + `backdrop-filter: blur(...)` + subtle border), hero with gradient/glow depth, service cards translucent not flat. Per-business palette stays distinct; glass is a texture layered on top of it, not a replacement.
- **Honest-minimal builds must still be full**: a prospect with a dead/unreachable site still needs a real hero, fleshed-out services (2-3 sentences each, not fragments), why-us, local-presence/service-area section, and a strong footer — minimum 4-5 real sections, never 2. Always at least one real photo (check `prospecting/photo-library/manifest.json` first). Thin because "being honest" is still a failure Jean will flag.
- **Service-card detail popups**: every service/feature card is clickable, opens a popup/modal with more detail (vanilla JS, fixed overlay + panel, close on backdrop/X), styled to match the site's glass treatment. Apply to every new build; add to an existing site only when it's already being touched for another fix.
- **Multi-page vs single-page**: check the prospect's real service-line count (Maps categories, their old site, what they publish) — never just the narrow Maps category label. One tight service line → single page. Multiple real trades or a long list (general maintenance contractor, general contractor, auto shop with a big services list) → genuine multi-page: Home + dedicated Services page(s), linked from nav. When in doubt, build the extra page — a single page thinner than the business's own existing site defeats the pitch.
- **No beige/cream backgrounds**, regardless of source-site color — overused, reads as generic AI default. Already caused rework on BUASHWAN and CleanFinishers.
- **Rating badge**: show the literal star number only when rating is genuinely strong (~4.5+); otherwise show just the review count.
- **Known layout bug, don't reintroduce**: footer must never be nested inside the `max-width:1180px` content column via negative-margin bleed (`margin: 0 -32px`). Correct pattern: close the content-column div before `<footer>`, make `<footer>` a full-width direct child of the outer wrapper, with its own `max-width:1180px; margin:0 auto; padding:0 32px` wrapper inside it.
- When `jeanReview` is `outdated` or `mid`, Jean has personally checked the site — treat it as confirmed ground truth that a real problem exists. The job is to *find* it (read the entire site: About, Services, Contact, sub-pages), not judge whether one exists. If genuinely not found, say "I couldn't find it myself, can you point me at it" — never cast doubt on the rating.

## Branding-layer methodology
- Distinct palette + typography + structural archetype per business — never repeat a look. Palettes used so far: teal x2, blue, indigo, plum, forest/olive green x2, navy+orange, crimson, violet, lime-green, slate-blue, orange, aqua, terracotta/rust, charcoal+brass, cobalt+coral, burgundy/wine, navy+dusty-rose, chocolate-brown+amber, steel-blue-gray+sand, dusty-mustard+ink, petrol-blue+copper, burnt-orange+teal, prussian-blue+marigold, charcoal+safety-orange, graphite+ice-blue, pine-green+coral. Pick something outside this list next.
- **Palette source**: Track 1 (has an existing site) — anchor to their actual dominant colors (header/hero/logo), build an elevated/refined version of that family; don't impose an arbitrary house style. Track 2 (no website) — pick freely from the list above.
- Real stock photos for people, never AI-generated. "What our clients say" only with real review quotes — never fabricate; if none exist, show the rating/review-count badge alone or omit the section. Logo marks in header/footer. Never fabricate a review or contact detail. Never touch the Instantly campaign's status/schedule.

## Speed
- Photos: check `prospecting/photo-library/manifest.json` for the niche before calling `fetch-stock-photo.yml`. Only fall back to the workflow when nothing fits, then copy the result back into the library with a manifest entry.
- Dispatch independent GitHub Actions jobs in parallel; `screenshot-fullpage.yml` and `sync-sheet.yml` both commit to the shared branch, so dispatch those one at a time and wait for each to finish. Check run status soon after dispatch, don't blind-sleep 20s first.
- `deploy.yml` takes an optional `site` input — always pass the specific slug for a targeted redeploy; omit only for a bulk change across many sites. A workflow-pushed commit (default `GITHUB_TOKEN`) does NOT trigger `deploy.yml`'s push trigger — dispatch it manually after such a commit, before screenshotting. A direct git push from the session DOES trigger it automatically.
- Teardown: if a prospect is removed from the board after already having a site, dispatch `teardown-site.yml` (site slug) and `git rm sites/<slug>/` in the same commit.

## Tracker Sheet sync
Any firing that changes a prospect doc (sourcing, review, build, status change) must also sync the Sheet: write a fresh rows JSON under `prospecting/sheet-sync/`, commit, then dispatch `sync-sheet.yml` with that `rows_file`. Build rows from **all** current prospect docs, not just this firing's changes — the sync script replaces each tab's data wholesale, so a partial set deletes everything else.

Shape: `{"existing": [...], "no_website": [...]}`, split by `modelVerdict == "no-website"` vs not.
- Existing-website rows: `name, country, niche, phone, email, email_flagged, instantly_lead_added, rating, reviews_count, verdict (jeanReview || modelVerdict), flaw, old_website, new_site_url, status, maps_link, updated_at`.
- No-website rows: same but `latest_review_at` instead of `verdict`/`old_website` (no `email_flagged`/`instantly_lead_added` — Track 2 is never auto-pushed, see below).
- Pass raw `email`/`phone`/`email_flagged`/`instantly_lead_added` — the script derives "Contact Method", "Email Flagged" and "On Instantly" display columns itself.
- This sync must run (and land in the Sheet) before relying on a given prospect's email for the standalone Instantly push — that script reads the Sheet, not the artifact directly.

## Once per day only (Step C — first firing after 07:00 Europe/Paris)
Artifact is 3 levels deep: country tabs → Existing Website / No Website split → niche chips (ac-repair, plumbing, carpenter, electrician, car-repair), plus a cross-country "Sites to Review" status view. Every prospect doc needs a `country` field or it won't show under any tab. Existing-website bucket = `modelVerdict != "no-website"`; no-website bucket = `modelVerdict == "no-website"`. Badges only render when the unreviewed count is > 0 — never reintroduce a badge that can show "0".

**Listing source**: pull raw Google Maps listings via `firecrawl_scrape` with `alexandria: {provider: "firecrawl-maps", capability: "businesses/search", options: {query: "<niche> <area> Dubai United Arab Emirates"}}` (returns name, address, phone, website, rating, review_count, maps_url, feature_id). For a specific listing's review dates/text (Track 2's recency bar), use `capability: "businesses/reviews"` with that `feature_id`, `sort: "newest"`. Both are pre-approved tools (`.claude/settings.json`) — don't use Apify's `call-actor` for this, it triggers a real-money Auto-mode approval prompt on every call and blocks the firing waiting on Jean (confirmed 2026-10-07). firecrawl-maps returns the same Google-sourced fields at no extra approval cost.

Source two daily batches from `pipeline_state/cursor`'s current niche+area (expand to the next niche/area if one track comes up short):
- **Track 1** (outdated/mid existing sites), target ~15/day: any prospect with a website at all qualifies — screenshot it, let the modelVerdict classifier judge it, push regardless of verdict.
- **Track 2** (no website), target ~15/day: bar is ≥20 Google reviews AND most recent review within the last 3 years. Record `latestReviewAt` (ISO date). Some niche/area combos genuinely don't have 15 qualifiers (businesses with 20+ reviews tend to already have a site) — if expanding to nearby areas still falls short, log why in `pipeline_state/cursor`'s note and advance the cursor anyway rather than stalling on the same niche next firing. Report the real Track 2 count to Jean in Step D, don't pad it.

**Before recording `modelVerdict: "no-website"`**, do both: (1) re-check the Maps listing beyond the website field (photos, posts, About) and (2) a general web search for business name + "Dubai" — Maps' own website field is unreliable (confirmed misses: BlueLine Appliance Repair, DUBAI ANAND CARPENTER had real undiscovered sites; Dilawar's Maps link was dead but their real site was findable via search). If either check surfaces a plausible real site, verify it matches (phone/address/name) and source under Track 1 instead.

**Email lookup for Track 2**: try to find one via the same search (Facebook/Instagram bio) and UAE directories (haiuae.com, uaedatabase.ae, magicpin, hidubai.com, 2gis.ae, yellowpages-uae.com). Record as `contactEmail` if found — same caution-on-found-emails rule applies. Never invent one; a couple minutes per prospect max.

Advance `pipeline_state/cursor` once both tracks hit target. Every pushed doc needs `country: "UAE"`.

**Step D** (summary email, every firing): send via `send-notification.yml` only when Step A, B, or C actually did something. Stay silent on a quiet firing. On a Step C firing, break the two tracks out separately.

## Downstream by contact method
Track 1 prospects with a `contactEmail` get pushed to Instantly automatically (by `push-instantly-leads.yml`, outside Claude Code) once their site is approved and synced to the Sheet. Track 2 prospects, and any Track 1 prospect with no usable email, are never auto-pushed — they live in the tracker Sheet for Jean's team to dispatch manually. Never invent an email or workaround contact method. A Track 2 prospect WITH a found email still isn't auto-pushed — flag it to Jean as an easy-sell candidate instead.

**Caution on found emails**: if a prospect's own contact page lists an email that clearly belongs to a different business (domain/name mismatch), still record it as `contactEmail` (it's the one they publish) but flag the mismatch clearly before it reaches Step B/Instantly — don't auto-push a mismatched email.
