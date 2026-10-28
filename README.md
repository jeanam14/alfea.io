# alfea.io — marketing site

The consolidated alfea.io site: one homepage plus two product pages, replacing
the three separate Netlify sites (alfea.io, reactivate.alfea.io,
web-creation.alfea.io). Plain static HTML/CSS/JS, no build step, no
framework — open any `index.html` directly in a browser to preview it.

## Structure

```
index.html                  → alfea.io/            (homepage)
reactivate-leads/index.html → alfea.io/reactivate-leads/
website-creation/index.html → alfea.io/website-creation/
assets/alfea.css            → shared foundation (fonts, nav/footer chrome,
                               buttons, cards, modal, forms, reveal motion)
assets/alfea.js             → shared behaviour: nav scroll state, mobile
                               sheet, reveal-on-scroll, modal, accordion
_redirects                  → Netlify redirect rules (see below)
```

Each page sets its own real brand tokens (colors/radius) in a `<style>`
block at the top of its own `<head>`, on top of the shared foundation —
see "Design system" below. Each page's own interactive components
(conversation replay, fit-check quiz, before/after slider, build
animation, scroll-linked timeline) are inline `<script>` blocks at the
bottom of that page's `index.html` — kept page-local since they're not
reused elsewhere.

Julaide (walkthrough video product) is **not** part of this repo — it stays
at julaide.io, in its own `jeanam14/julaide` repo. This site only links out
to it (nav, homepage card, footer).

## Connecting Netlify

1. In Netlify: **Add new site → Import an existing project → Deploy with
   GitHub**, pick this repo (`alfea-site`).
2. Build settings: leave the build command empty and set the publish
   directory to `/` (repo root) — there's nothing to build, it's static.
3. Point the `alfea.io` domain (and `www.alfea.io` if used) at this new
   site in Netlify's domain settings.
4. Once you're happy with the new site and want the old subdomains to
   redirect here instead of serving their old content: in this same
   Netlify site's **Domain management**, add `reactivate.alfea.io` and
   `web-creation.alfea.io` as **domain aliases**. The `_redirects` file
   already has the 301 rules waiting for that — nothing else to configure.
   Do this only when you're ready to retire the old sites, since adding the
   alias points that hostname's traffic at this site immediately.

## What NOT to touch

`web-creation.alfea.io` is also the parent domain for closed client preview
sites (`<slug>.web-creation.alfea.io`), set up by the separate
`jeanam14/alfea.io` prospecting-pipeline repo. The `_redirects` rule above
only redirects the bare `web-creation.alfea.io` hostname, not anything
below it — don't turn that into a wildcard, it would break every live
client site at that pattern.

## Design system

Alfea's real existing brand, pulled directly from the live reactivate.alfea.io
and web-creation.alfea.io sites — not an invented look. Light, ink-on-paper
throughout (`--ink:#0A1F1C`), Fraunces for headings (one italic word per H1)
and Inter for body, the real logo/favicon hotlinked from
`web-creation.alfea.io` (safe long-term — see "What NOT to touch" above).
Each page carries its own native accent on top of the shared foundation:

- **Homepage** — ink-on-paper base (`#F7F5F0`), 4px buttons / 6px cards.
  Each service card carries its own accent bar only: teal for Reactivate
  Leads, clay for Website Creation, slate-indigo (`#4E5A86`, new — not from
  an existing product, flag to Jean if he wants it changed) for Julaide.
- **`/reactivate-leads/`** — teal + mint (`--accent:#0A6E63`,
  `--teal:#0DBC9C`, `--mint:#5EE7C7`, `--tint:#E8F7F3`), pill buttons
  (999px radius), real WhatsApp bubble colors in the conversation demo.
- **`/website-creation/`** — clay/terracotta on paper
  (`--clay:#D17147`, `--paper:#F7F5F0`, `--paper-deep:#EFEBE2`), 4px
  radius throughout, the "How a project runs" section inverts to an ink
  background with paper text (the one deliberate dark moment, matching
  the live site), real portfolio photos hotlinked from
  `web-creation.alfea.io` (work-law.jpg / work-trade.jpg / work-clinic.jpg).

No backdrop-blur or translucency anywhere except the sticky nav; no
cursor-following effects; no colored glow shadows — flat soft shadows only.

## Honesty notes baked into the copy

- Every mock conversation, sample report and before/after mockup is
  labelled "Example" / "Illustrative" — none of it is real client data.
- FAQ answers and form fields on /reactivate-leads/ are lifted from the
  live reactivate.alfea.io copy, not rewritten, so legal/consent language
  stays exactly as it was reviewed.
- No client logos, testimonials or performance stats are shown anywhere —
  add real ones only when you have them to share.
- The pilot-request form on `/reactivate-leads/` uses **Netlify Forms**
  (`data-netlify="true"`, same mechanism as the live reactivate.alfea.io
  form) — it works automatically once this repo is deployed on Netlify, no
  extra setup. Submissions land in Netlify → Forms on this site; add a
  notification there (email/Slack/Zapier) if you want an alert per
  submission instead of checking the dashboard.
