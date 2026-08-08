# 9. Publish as a static site, with the policy as the promise

Date: 2026-08-07
Status: Accepted

## Context

Twelve tools work end to end and none of them needs a server: every one reads
its file, does the work in a worker, and hands the result back without a request
leaving the tab. Nothing was deployed, so nobody could use them, and the claim
on every tool page — that the file stays on the device — was something a visitor
had to take on trust.

Phase 3 adds an API for the operations a browser genuinely cannot do. That does
not change what phase 1 and 2 are: static files.

## Decision

Publish `apps/web/dist` as a static site on Cloudflare Pages, with Netlify as an
equivalent fallback. No server, no build secrets, no runtime.

The build emits its own host configuration, so the deploy is a build command and
an output directory rather than a dashboard full of settings:

- `_headers` — the content policy, the security headers, and cache lifetimes.
  Both hosts read this format.
- `_redirects` — the single-page fallback, so a deep link is served the app
  instead of a 404 at the edge.
- `sitemap.xml` and `robots.txt` — generated from the tool manifests, so they
  cannot list a tool the registry does not have.

The policy is the part worth arguing for. `connect-src 'self'` means the page
may not send anything anywhere except back to this origin, and this origin has
no endpoint to send it to. The privacy claim stops being a sentence in the copy
and becomes something the visitor's own browser enforces, verifiable from the
network tab. Widening it needs a reason worth writing down here.

## Consequences

- The inline theme script has to be named in the policy by hash. The build
  hashes what it actually emitted and fails if it finds no inline script, so the
  policy and the script cannot drift apart silently — the failure would
  otherwise be invisible in dev, where no policy is served, and show up in
  production as a flash of the wrong theme on every visit.
- `style-src` needs `'unsafe-inline'`. React writes `style` attributes for the
  crop selection and the compress preview, and attribute styles cannot be
  hashed. It was the only concession in the policy until ADR 10 added
  `'wasm-unsafe-eval'` to `script-src`.
- Link previews describe the site, not the page, because scrapers do not run
  JavaScript. Per-page previews need prerendering, which is not built.
- Planned tools are left out of the sitemap. Their pages exist and say "Soon";
  asking a search engine to index fourteen of those buys thin results against
  our own name.
- Phase 3 does not fit this shape. When an API exists it is a separate origin
  and a separate deploy, and `connect-src` has to name it — which is the moment
  to be loud in the product about which tools upload and which do not.
- Verified before publishing by serving `dist` locally with the generated
  headers applied: a deep link resolves, the theme script runs, and a full
  image conversion completes in a worker with no policy violations.
