# alfea.io — client site pipeline

This repo holds every client preview/production site as a plain static page
under `sites/`, built from a vertical starter under `templates/`. Pushing to
`main` or `claude/agency-website-scale-bat25b` (the working branch Claude
Code develops on — there's no PR flow here, that branch is pushed to
directly) auto-deploys whatever changed to its own free Cloudflare Pages
preview at `alfea-<slug>.pages.dev` — that's the link that goes out to
prospects. The branded `<slug>.web-creation.alfea.io` hostname is **not**
created at this stage (see "At close" below).

No build step, no framework, no Higgsfield credits spent, no Claude branding
anywhere in the delivered site.

**Hosting is Cloudflare Pages, DNS stays on Netlify.** Netlify's 2026
credit-based free plan (300 credits/month, ~20 deploys) is shared with
julaide.io on the same account and can't sustain this project's deploy
frequency. Cloudflare Pages' free tier (500 builds/month, unlimited
bandwidth, no shared quota) can — so client sites deploy there, while
alfea.io's DNS, email, and main site stay exactly as they are on Netlify.

Every prospect site gets a Cloudflare Pages project — that part's free and
unlimited. A Netlify DNS record in the alfea.io zone is a separate, later
step reserved for sites that actually close (see "At close"), specifically
so the zone doesn't accumulate one record per cold pitch — hundreds of
records for prospects who never signed. Nothing about Netlify's own sites
is ever touched.

## How a new site gets made

1. You give Jean the prospect's info (whatever you copy-pasted from Google
   Maps, their Instagram, etc. — no formatting needed).
2. Jean picks a template deliberately for that specific prospect and
   scaffolds it:
   ```
   scripts/new-site.sh trades rivera-plumbing
   ```
   **Don't default to the same template for every prospect just because it
   was the one most recently polished.** Each business gets evaluated on
   its own — does it sell products people should browse and buy
   (`ecommerce-catalog`), is it a service business with no catalog
   (`trades`, or a new vertical worth adding), or does it need something
   bespoke this repo doesn't have a starter for yet. Picking on autopilot
   is exactly how one client's one-off polish quietly becomes everyone
   else's generic starting point.
3. Jean fills in every token in `sites/rivera-plumbing/index.html` (see the
   template's `TOKENS.md`) with the real business's content — name, phone,
   address, services, real Google reviews, real photos.
4. Jean commits and pushes to `main`.
5. GitHub Actions deploys `sites/rivera-plumbing` to its own Cloudflare Pages
   project. No DNS record or branded hostname yet — just the free preview
   at `alfea-rivera-plumbing.pages.dev`.
6. Jean hands you back that `.pages.dev` URL to email the prospect.

Steps 2-5 are all done inside this Claude Code session — you never touch
Cloudflare, Netlify, GitHub Actions, or a terminal yourself.

## At close

Same site, same deploy — nothing gets rebuilt. First, wire up the branded
hostname, which only happens now, not at preview time:

- Run the **Activate client domain** workflow (Actions tab → Activate client
  domain → Run workflow), entering the site's slug. This attaches
  `<slug>.web-creation.alfea.io` as a custom domain on the existing
  Cloudflare Pages project and creates the one Netlify DNS record it needs —
  the only time either happens for that site.
- Remove the `<meta name="robots" content="noindex, nofollow">` line at the
  top of the client's `index.html`.
- Either attach their own domain as an additional custom domain on the same
  Cloudflare Pages project (their registrar needs a CNAME to
  `alfea-<slug>.pages.dev`), or keep them on `*.web-creation.alfea.io` and
  bill hosting.

## One-time setup — what needs to happen outside this repo

- [x] **DNS confirmed** — alfea.io is delegated to Netlify DNS (confirmed via
      the exported DNS records: the `NETLIFY` apex record only exists on a
      Netlify-hosted zone). DNS stays on Netlify; only hosting for client
      sites moves to Cloudflare Pages.
      Note: this Netlify account/team also hosts `julaide.io`, an unrelated
      business — this pipeline's Netlify token is used only to add DNS
      records in the alfea.io zone, never to touch any Netlify site.
- [ ] **Cloudflare account** created with `jean@alfea.io`.
- [ ] **A scoped Cloudflare API token** — Cloudflare dashboard → My Profile →
      API Tokens → Create Token → custom token with
      `Account.Cloudflare Pages: Edit`. Do not use the Global API Key.
- [ ] **The Cloudflare Account ID** — visible on the right sidebar of the
      Workers & Pages overview page in the dashboard.
- [ ] **A Netlify Personal Access Token** — Netlify → User settings →
      Applications → Personal access tokens → New access token. (Only used
      by the Activate client domain workflow, at close — see above.)
- [ ] **Add all three as GitHub repo secrets** — this repo's Settings →
      Secrets and variables → Actions → New repository secret:
      - `CLOUDFLARE_API_TOKEN`
      - `CLOUDFLARE_ACCOUNT_ID`
      - `NETLIFY_AUTH_TOKEN`

      Set these yourself in the GitHub UI — they should never be pasted into
      chat. Once the two Cloudflare secrets are set, every push to `sites/**`
      deploys automatically to a `.pages.dev` preview; nothing further needs
      sharing with Claude. `NETLIFY_AUTH_TOKEN` only needs to be valid when
      you actually run Activate client domain for a closed deal.

Everything else (templates, new sites, content, pushes) happens inside this
Claude Code session.

## Repo structure

```
templates/
  trades/              starter for plumbers, electricians, contractors — no product catalog
  ecommerce-catalog/   starter for businesses that sell physical products online — a
                       trading/wholesale company, a parts supplier, a retailer (this is
                       what the Power Cool build was generalized into). Home page +
                       separate shop.html catalog with category/brand/price filters,
                       cart, quick view, currency selector. Not a default — see the
                       "picks a template deliberately" note above.
  (more verticals added as needed: legal, medical, salon, generic)
sites/
  <client-slug>/      one folder per client, previewed at alfea-<slug>.pages.dev
                       until it closes, then also on <slug>.web-creation.alfea.io
scripts/
  new-site.sh          scaffolds sites/<slug> from a template
.github/workflows/
  deploy.yml                  deploys changed sites/* folders to Cloudflare Pages
  activate-client-domain.yml  wires up the branded hostname + DNS, at close only
```
