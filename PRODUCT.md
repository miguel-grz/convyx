# Product

## Platform

web

## Users

Primary: someone who arrived holding a file that is the wrong shape and wants it
fixed now — five PDFs that should be one, a scan nobody can search, a 12 MB photo
that has to be under 2 MB. They are not a specialist, they are mid-task in
something else, and this detour should cost seconds. They arrive from a search or
a bookmark, use one tool, and leave.

Secondary, and explicitly second in priority: engineers and recruiters opening the
link from LinkedIn to judge the author's work. They are served by the depth being
real, not by the interface explaining itself to them.

## Product Purpose

Convert, combine and clean up documents and images without an account and without
surrendering the file. Success is one visit: land, drop the file, get the result,
leave. There is no engagement to grow.

## Positioning

Competitors upload everything, which is why they all need a retention policy and
a paragraph asking you to trust it. Convyx does the work in the browser wherever
it is technically possible — 15 of 26 catalogued tools — so for most jobs there
is no file on a server to retain, log or leak. Where a server is genuinely
required (OCR, Office conversion, background removal), deletion is enforced by a
scheduled sweep rather than promised.

The claim is structural, not a policy page, and it is the one thing a competitor
built on uploads cannot copy without rebuilding.

## Operating Context

Interrupt-driven and single-purpose. The user is on a desktop or laptop, often
with the source file already in a folder they have open, and frequently under
mild time pressure inside a larger task (sending an application, filing an
expense, uploading a form that rejects their file). They will not read an
onboarding flow, create an account, or compare features. Repeat visits are for a
different tool, not the same one.

## Capabilities and Constraints

- 26 tools catalogued across two categories, PDF (18) and Image (8). Categories
  for audio, video, documents and generators exist in the contract and are
  expected later.
- Exactly one tool ships working today: **Merge PDF**, entirely client-side via
  pdf-lib in a Web Worker. Every other tool is `status: 'planned'` and must be
  presented as such.
- Architecture: every tool is a self-contained folder discovered from the
  filesystem by a Tool Registry. Routes, navigation, catalog, search and the
  privacy page are all derived from tool manifests, so any surface that lists
  tools must read from the registry rather than hardcode them.
- Per-tool file size limits (25–200 MB) are declared in manifests and must be
  visible before a file is chosen.
- Client-side tools are bounded by device memory; server tools do not exist yet.
- Interface language is English. Tool ids are the URLs.

## Brand Commitments

The name **Convyx** is fixed.

**Binding, decided 2026-08-07 after two concept-led directions were built and
discarded:** the interface follows category convention rather than a visual
metaphor. The craft bar is iLovePDF and Smallpdf for structure — a searchable
grid of tool cards with category-coloured icons, obvious labelled buttons, an
evident three-step flow — and Linear and Vercel for finish: precise typography,
restrained dark surfaces, careful micro-interaction.

Discarded, and not to be revisited without a deliberate decision to reopen it:
the transform-notation index (too austere) and the accretion-disk world (read as
an app for something else). Motion and scroll animation stay.

## Evidence on Hand

- Real and demonstrable: Merge PDF, working, in the browser, with no network
  request. This is the only functioning demonstration and it is genuine.
- Real: the codebase, the ADRs in `docs/adr/`, and the Tool Registry pattern
  described in `docs/architecture.md`.
- Does not exist and must not be implied: deployment, users, traffic, uptime,
  processing volume, testimonials, press, customers, ratings, "trusted by"
  claims, comparison benchmarks, or any tool other than Merge PDF working.
- The 25 planned tools are real intentions, not shipped capability. Any surface
  showing them must mark them as not yet available.

## Product Principles

1. **The file stays put unless it cannot.** Server processing is an admission of
   technical necessity, never a convenience, and the user is told which one they
   are getting before they act.
2. **One visit, one job.** Nothing on any surface exists to keep someone here
   longer than their task.
3. **Say what is not built.** A catalog that lists 26 tools and ships 1 is honest
   only if the difference is unmissable.
4. **The catalog is the product.** Growth is more tools, not more features per
   tool, so every surface must stay correct as the count multiplies.
5. **No account, ever, for the core catalog.** Nothing is gated behind identity.
6. **Write for the person holding the file, not the person reading the code.**
   Product surfaces state results — private, instant, free, nothing to install.
   They never explain the mechanism: no servers, uploads, workers, threads,
   sweeps or network tabs. That vocabulary belongs to the secondary audience and
   lives where they look — README, `docs/adr`, and the privacy page.

## Accessibility & Inclusion

No user-specific requirement was established. Baseline holds: keyboard operable
throughout, visible focus, labelled file inputs, WCAG AA contrast, and reduced
motion respected — the file picker and the result download are the two paths that
must never depend on a pointer.
