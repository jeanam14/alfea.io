# alfea.io — client site pipeline

This repo holds every client preview/production site as a plain static page
under `sites/`, built from a vertical starter under `templates/`. Pushing to
`main` auto-deploys whatever changed, to its own
`<slug>.web-creation.alfea.io` — scoped under the website-creation service
branch, separate from the AI-receptionist service on the main domain.

No build step, no framework, no Higgsfield credits spent, no Claude branding
anywhere in the delivered site.

**Hosting is Cloudflare Pages, DNS stays on Netlify.** Netlify's 2026
credit-based free plan (300 credits/month, ~20 deploys) is shared with
julaide.io on the same account and can't sustain this project's deploy
frequency. Cloudflare Pages' free tier (500 builds/month, unlimited
bandwidth, no shared quota) can — so client sites deploy there, while
alfea.io's DNS, email, and main site stay exactly as they are on Netlify.
Each new client gets one Cloudflare Pages project plus one DNS record added
to the existing Netlify zone; nothing about Netlify's own sites is touched.

## How a new site gets made

1. You give Jean the prospect's info (whatever you copy-pasted from Google
   Maps, their Instagram, etc. — no formatting needed).
2. Jean picks the closest template and scaffolds it:
   ```
   scripts/new-site.sh trades rivera-plumbing
   ```
3. Jean fills in every token in `sites/rivera-plumbing/index.html` (see the
   template's `TOKENS.md`) with the real business's content — name, phone,
   address, services, real Google reviews, real photos.
4. Jean commits and pushes to `main`.
5. GitHub Actions deploys `sites/rivera-plumbing` to its own Cloudflare Pages
   project and points `rivera-plumbing.web-creation.alfea.io` at it via a new
   record in Netlify DNS.
6. Jean hands you back that URL to email the prospect.

Steps 2-5 are all done inside this Claude Code session — you never touch
Cloudflare, Netlify, GitHub Actions, or a terminal yourself.

## At close

Same site, same deploy — nothing gets rebuilt:

- Remove the `<meta name="robots" content="noindex, nofollow">` line at the
  top of the client's `index.html`.
- Either attach their own domain as an additional custom domain on the same
  Cloudflare Pages project (their registrar needs a CNAME to
  `alfea-<slug>.pages.dev`, same pattern as the preview subdomain), or keep
  them on `*.web-creation.alfea.io` and bill hosting.

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
      Applications → Personal access tokens → New access token. (Used only
      for adding DNS records — see the note above.)
- [ ] **Add all three as GitHub repo secrets** — this repo's Settings →
      Secrets and variables → Actions → New repository secret:
      - `CLOUDFLARE_API_TOKEN`
      - `CLOUDFLARE_ACCOUNT_ID`
      - `NETLIFY_AUTH_TOKEN`

      Set these yourself in the GitHub UI — they should never be pasted into
      chat. Once all three are set, every push to `sites/**` deploys
      automatically; nothing further needs sharing with Claude.

Everything else (templates, new sites, content, pushes) happens inside this
Claude Code session.

## Repo structure

```
templates/
  trades/            starter for plumbers, electricians, contractors
  (more verticals added as needed: legal, medical, salon, generic)
sites/
  <client-slug>/      one folder per client, deployed to <slug>.web-creation.alfea.io
scripts/
  new-site.sh          scaffolds sites/<slug> from a template
.github/workflows/
  deploy.yml           deploys changed sites/* folders on push to main
```
