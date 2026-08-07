# 1. Discover tools by filesystem convention

Date: 2026-08-07
Status: Accepted

## Context

The catalog is expected to grow from 26 tools to a few hundred, across
categories that do not exist yet. The failure mode to avoid is the one every
tool site has: adding a tool means editing a router, a nav array, a catalog
page, a search index and a category map, and forgetting one of them.

## Decision

Tools are discovered from the filesystem with `import.meta.glob('./*/manifest.ts')`.
There is no central array to register into — a folder that contains a manifest
is a tool.

Manifests load eagerly (they are small data objects that the catalog, search and
route resolution all need immediately). Components load lazily, so a tool's
dependencies stay out of the initial bundle.

The registry validates its invariants at import time and throws: id must equal
folder name, ids unique, `available` implies a `Tool.tsx`, `server` implies an
endpoint. Since the registry is imported by the app entry, a violation fails the
production build rather than shipping an unreachable tool.

## Consequences

- Adding a tool touches no shared file. This is the property the whole codebase
  is organised around.
- Tool ids are coupled to folder names. Renaming a tool means renaming a folder
  and breaking its URL — acceptable, and the invariant makes it loud.
- The glob is Vite-specific. Moving off Vite would mean replacing one function.
- Everything derived from manifests is guaranteed consistent, including the
  privacy page, which cannot claim a tool runs locally when it does not.
