# Archive Bookshelf Experiment — Design QA

- source visual truth: `/Users/gao/.codex/visualizations/2026/07/21/019f8528-f5a4-7543-b119-751b3e73c72e/01-gustavo-books-desktop.png`
- implementation screenshots:
  - `/Users/gao/.codex/visualizations/2026/07/21/019f8528-f5a4-7543-b119-751b3e73c72e/archive-experiment/05-archive-grid-desktop-final.png`
  - `/Users/gao/.codex/visualizations/2026/07/21/019f8528-f5a4-7543-b119-751b3e73c72e/archive-experiment/06-archive-grid-mobile-final.png`
- viewports: `1512 × 861`, `390 × 844`
- state: `/archive`, light theme, grid view selected

## Full-view comparison evidence

- Desktop comparison: `archive-experiment/07-desktop-final-comparison.png`
- Mobile comparison: `archive-experiment/08-mobile-final-comparison.png`
- The implementation preserves the reference's small covers, generous whitespace, status-first metadata, and borderless shelf items.
- The warm paper background, Chinese serif typography, existing recommendation section, and six-column desktop layout are intentional adaptations to this project's design system and 76rem content width.

## Focused region comparison evidence

- Grid comparison: `archive-experiment/09-focused-grid-comparison.png`
- Cover scale, vertical metadata order, row spacing, and low-contrast secondary text were readable at this crop, so no additional detail crop was needed.

## Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] Finished dates add more text than the reference cards. This is retained because reading chronology is useful archive metadata.
- [P3] The recommendation section pushes the grid below the first viewport. This is an existing product-level section and is outside this grid-only experiment.

## Required fidelity surfaces

- Fonts and typography: project fonts intentionally retained; title hierarchy and two-line truncation remain stable. Status text was raised to a computed 12px after the first pass.
- Spacing and layout: six desktop columns and two mobile columns; no horizontal overflow at either tested viewport.
- Colors and tokens: existing paper, sage, ochre, and accent tokens map to archived, reading, and shelved states.
- Image quality and assets: existing WeRead covers are used directly with a fixed 2:3 crop; no placeholders or generated substitutes were introduced.
- Copy and content: only verifiable local states are shown: `在读`, `已读`, and `藏书`.
- Interaction and accessibility: list/grid toggle works, remains visible on mobile, cards remain links, focus styling is preserved, and browser console contained no errors.

## Comparison history

1. First pass: status labels rendered at 11px, creating a P2 readability risk.
2. Fix: raised `.archive-grid-status` to `0.8125rem`.
3. Final pass: status labels compute to 12px; desktop/mobile grids have no horizontal overflow and no console errors.

## Follow-up polish

- Consider testing a grid-only variant without the recommendation section if the experiment later expands beyond item styling.

final result: passed
