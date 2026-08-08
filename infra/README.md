# Deploying Convyx

The site is static. There is no server to run, nothing to provision, and no
secret to hold — the build produces a folder, and the host serves it.

Everything the host needs is generated into that folder by the build itself
(`_headers`, `_redirects`, `sitemap.xml`, `robots.txt`), so the settings below
are the whole configuration. See ADR 0009 for why.

## Cloudflare Pages

Connect the repository once, then every push to `main` publishes.

| Setting          | Value                           |
| ---------------- | ------------------------------- |
| Framework preset | None                            |
| Build command    | `pnpm install && pnpm build`    |
| Build output     | `apps/web/dist`                 |
| Root directory   | _(leave empty — the repo root)_ |
| Node version     | `22` (`NODE_VERSION` variable)  |

Netlify takes the same four values and reads the same `_headers` and
`_redirects`, so it works as a drop-in alternative.

## Using your own domain

The default is Cloudflare's `convyx.pages.dev`. To publish anywhere else, set
one build variable:

```
VITE_SITE_URL=https://your-domain.example
```

It is the single source for the canonical link, the link-preview tags and the
sitemap, so nothing else needs changing. Without it the build falls back to the
`pages.dev` address, which keeps a fresh clone building correctly.

On Cloudflare, add the domain under the project's **Custom domains** tab; it
issues the certificate and serves both apex and `www`. Set `VITE_SITE_URL` in
the same dashboard and redeploy so the sitemap and previews point at the new
address rather than the old one.

## Checking a deploy

```bash
curl -sI https://your-domain.example/tools/pdf-merge
```

Three things say the deploy is healthy:

- `200`, not `404` — the single-page fallback is in place.
- A `Content-Security-Policy` header that names a `sha256-…` script hash. An
  empty `script-src 'self'` means the theme script is being blocked.
- `Cache-Control: no-cache` on the HTML, so the next deploy actually lands.

To reproduce the production headers locally before pushing, serve `dist` with
any static server that applies `_headers`. The build is the same one the host
receives, so a policy that works locally works there.
