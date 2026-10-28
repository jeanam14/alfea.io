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
assets/alfea.css            → shared design system (all 3 pages)
assets/alfea.js             → shared behaviour: nav, reveal-on-scroll,
                               card spotlight, modal, count-up, accordion
_redirects                  → Netlify redirect rules (see below)
```

Each page's own interactive components (conversation replay, fit-check
quiz, before/after slider, build animation, scroll-linked timeline) are
inline `<script>` blocks at the bottom of that page's `index.html` — kept
page-local since they're not reused elsewhere.

Julaide (walkthrough video product) is **not** part of this repo — it stays
at julaide.io, in its own `jeanam14/julaide` repo. This site only links out
to it (nav, homepage card, footer, "More from Alfea" strips).

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

"Basalt & Sodium" — dark basalt base (`--basalt-0/1/2`), one shared brand
accent (`--sodium`, warm amber) used for every primary button and the one
italic word per headline, plus a distinct accent per product used only for
glows/icons/borders: Pulse (green, Reactivate Leads), Blueprint (blue,
Website Creation), Reel (orange, Julaide — referenced on the homepage
only). Typography: Bricolage Grotesque (display), Instrument Serif italic
(the one-word emphasis), Geist (body), Geist Mono (labels/eyebrows/stats).
Full section-by-section brief available on request if this needs
extending — ask Claude to regenerate it from the original design pass.

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
