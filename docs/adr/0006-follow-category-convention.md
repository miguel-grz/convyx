# 6. Follow category convention rather than a visual concept

Date: 2026-08-07
Status: Accepted

## Context

Two concept-led directions were designed and built before this one: a
transform-notation index (`PDF+ → PDF` set as the primary visual element) and an
accretion-disk world where the event horizon stood for the boundary of the
user's device. Both were coherent. Both were rejected on sight — the first as
too austere, the second because it read as an app for something other than file
conversion.

Convention, executed properly, was the remaining option — and on reflection the
right one for a utility someone uses once and leaves.

## Decision

The interface follows the conventions of its category. Structure comes from
iLovePDF and Smallpdf: a searchable grid of tool cards, category-coloured icons,
labelled buttons in sentence case, a visible three-step flow. Finish comes from
Linear and Vercel: one accent, restrained surfaces, precise type, careful
micro-interaction.

The differentiation budget is spent on the product's actual difference — that
most tools never upload the file — and that is stated with numbers generated
from the registry, not with a metaphor.

## Consequences

- A visitor mid-task recognises the interface immediately, which is the whole
  job for a utility used once and left.
- The design will resemble other good products in the category. That is the
  accepted trade, not an oversight.
- Recorded as a brand commitment in PRODUCT.md, so it is not drifted away from
  by accident.
- The `transform` field stays in `ToolManifest` as data, but nothing renders it
  today. ADR 0004 is superseded.
