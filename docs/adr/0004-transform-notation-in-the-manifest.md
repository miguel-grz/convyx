# 4. Make the transform part of the manifest

Date: 2026-08-07
Status: Superseded by 0006 (the notation is no longer a visual element; the
data stays in the contract and is unused by the current UI)

## Context

People do not look for these tools by name. They arrive holding a file and
wanting a different one: "I have a PDF, I need a Word document." A catalog
indexed by tool name makes them translate their problem into our vocabulary
first.

## Decision

Every manifest declares `transform: { from, to, note? }` — short uppercase
format tokens, with `+` meaning "any number of". The catalog, the tool page and
the landing hero are all indexed on it, and it is the product's primary visual
element.

`note` is required in practice whenever `from` and `to` match: eighteen PDF tools
would otherwise all read `PDF → PDF`.

## Consequences

- The catalog is scannable by the thing users actually know.
- `PDF+ → PDF` and `PDF → PDF+` distinguish merge from split without prose.
- The tokens are display strings, not the mime types in `accepts`. They are
  chosen for legibility (`DOCX`, not `application/vnd.openxml…`), which means
  they can drift from `accepts` — reviewers should check both together.
