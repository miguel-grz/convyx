# 5. Generate the icon set from the manifests

Date: 2026-08-07
Status: Accepted

## Context

Manifests name their icon as a string, which is what keeps the app shell from
having to know that a tool exists. `lucide-react/dynamic` honours that at
runtime, but it makes every icon in the library reachable: the production build
emitted 1,628 chunks and 7.5 MB for the roughly 30 icons actually in use.

A hand-maintained icon map would fix the bundle and break the invariant — adding
a tool would mean editing a shared file.

## Decision

A Vite plugin (`apps/web/vite/icons-plugin.ts`) reads the `icon:` field out of
every `src/tools/*/manifest.ts` and out of the contract's category table, then
emits `virtual:convyx-icons` containing exactly those imports. `Icon` resolves
names through that map, and warns in development when a manifest names an icon
that does not exist.

## Consequences

- 1,628 chunks and 7.5 MB become 11 chunks and 1.1 MB; the entry bundle drops
  from 502 kB to 387 kB.
- Adding a tool still touches only its own folder. The plugin invalidates the
  virtual module on manifest changes, so the dev server does not need a restart.
- Icon names are matched with a regular expression rather than by parsing TS.
  That is safe for the one-line `icon: 'name'` form the manifests use, and a
  miss degrades to a blank box with a dev-time warning rather than a crash.
