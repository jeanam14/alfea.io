# alfea.io — client site pipeline

This repo holds every client preview/production site as a plain static page
under `sites/`, built from a vertical starter under `templates/`. Pushing to
`main` auto-deploys whatever changed, to its own
`<slug>.web-creation.alfea.io` — scoped under the website-creation service
branch, separate from the AI-receptionist service on the main domain.

No build step, no framework, no Higgsfield credits spent, no Claude branding
anywhere in the delivered site. Hosting is Netlify, matching the rest of
alfea.io's infrastructure.

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
5. GitHub Actions deploys `sites/rivera-plumbing` as its own Netlify site and
   points `rivera-plumbing.web-creation.alfea.io` at it.
6. Jean hands you back that URL to email the prospect.

Steps 2-5 are all done inside this Claude Code session — you never touch
Netlify, GitHub Actions, or a terminal yourself.

## At close

Same site, same deploy — nothing gets rebuilt:

- Remove the `<meta name="robots" content="noindex, nofollow">` line at the
  top of the client's `index.html`.
- Either attach their own domain as an additional custom domain on the same
  Netlify site (Netlify → the site → Domain management → Add a domain), or
  keep them on `*.web-creation.alfea.io` and bill hosting.

## One-time setup — what needs to happen outside this repo

- [ ] **Netlify account** — using the existing alfea.io Netlify account/team
      (the one already hosting the main site), not a new one.
- [ ] **Confirm how alfea.io's DNS is set up** — this decides whether new
      client subdomains attach themselves automatically or need one manual
      step per client:
      - Check Netlify → Sites → the site with `web-creation.alfea.io` as its
        custom domain → Domain management. If Netlify shows **"Netlify
        DNS"** for the zone, new `*.web-creation.alfea.io` subdomains
        provision automatically — nothing further to do per client.
      - If it shows an **external DNS provider** instead, a CNAME record for
        each new client subdomain (`<slug>.web-creation.alfea.io` →
        `alfea-<slug>.netlify.app`) needs to be added manually wherever
        alfea.io's DNS is actually managed, once per new client, until this
        gets automated further.
      - Report back which case it is — the deploy workflow already handles
        both, but the second case means an extra manual step per client for
        now.
- [ ] **A Netlify Personal Access Token** — Netlify → User settings →
      Applications → Personal access tokens → New access token.
- [ ] **Add it as a GitHub repo secret** — this repo's Settings → Secrets
      and variables → Actions → New repository secret:
      - `NETLIFY_AUTH_TOKEN`

      Set this yourself in the GitHub UI — it should never be pasted into
      chat. Once it's set, every push to `sites/**` deploys automatically;
      nothing further needs sharing with Claude.

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
