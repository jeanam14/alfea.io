# alfea.io — client site pipeline

This repo holds every client preview/production site as a plain static page
under `sites/`, built from a vertical starter under `templates/`. Pushing to
`main` auto-deploys whatever changed, to its own `<slug>.alfea.io`.

No build step, no framework, no Higgsfield credits spent, no Claude branding
anywhere in the delivered site.

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
5. GitHub Actions deploys `sites/rivera-plumbing` to Cloudflare Pages and
   attaches `rivera-plumbing.alfea.io` automatically.
6. Jean hands you back that URL to email the prospect.

Steps 2-5 are all done inside this Claude Code session — you never touch
Cloudflare, GitHub Actions, or a terminal yourself.

## At close

Same site, same deploy — nothing gets rebuilt:

- Remove the `<meta name="robots" content="noindex, nofollow">` line at the
  top of the client's `index.html`.
- Attach their own domain as a second custom domain on the same Cloudflare
  Pages project (Cloudflare dashboard → Workers & Pages → the project →
  Custom domains → Add), or keep them on `*.alfea.io` and bill hosting.

## One-time setup — what needs to happen outside this repo

- [ ] **Cloudflare account** created with `jean@alfea.io` (in progress).
- [ ] **alfea.io's DNS added to that Cloudflare account** — if the domain is
      registered elsewhere, add it as a site in Cloudflare and update the
      nameservers at the registrar to Cloudflare's. Without this,
      `*.alfea.io` subdomains can't be attached to Pages projects.
- [ ] **A scoped Cloudflare API token** — Cloudflare dashboard → My Profile →
      API Tokens → Create Token → custom token with `Account.Cloudflare
      Pages: Edit` and `Zone.DNS: Edit` (scoped to the alfea.io zone only).
      Do not use the Global API Key.
- [ ] **The Cloudflare Account ID** — visible on the right sidebar of the
      Workers & Pages overview page in the dashboard.
- [ ] **Add both as GitHub repo secrets** — this repo's Settings → Secrets
      and variables → Actions → New repository secret:
      - `CLOUDFLARE_API_TOKEN`
      - `CLOUDFLARE_ACCOUNT_ID`

      Set these yourself in the GitHub UI — they should never be pasted into
      chat. Once they're set, every push to `sites/**` deploys automatically;
      nothing further needs sharing with Claude.

Everything else (templates, new sites, content, pushes) happens inside this
Claude Code session.

## Repo structure

```
templates/
  trades/            starter for plumbers, electricians, contractors
  (more verticals added as needed: legal, medical, salon, generic)
sites/
  <client-slug>/      one folder per client, deployed to <slug>.alfea.io
scripts/
  new-site.sh          scaffolds sites/<slug> from a template
.github/workflows/
  deploy.yml           deploys changed sites/* folders on push to main
```
