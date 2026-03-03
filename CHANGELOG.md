# Changelog

All notable changes to this project are documented in this file.

## [0.3.0] - 2026-03-04

### Added
- Added a shared `widget-reset.css` stylesheet export for downstream widgets that need WordPress/theme-safe reset behavior.
- Added `snapToStep` support to the counter state model and DOM adapter so committed values can snap to the nearest valid step from `min`.
- Added DOM test coverage for automatic `.bp-widget-reset` application across counter, select, radio, and checkbox components.

### Changed
- Counter, select, radio, and checkbox roots now auto-apply `.bp-widget-reset`.
- Select popovers now also receive the shared reset class so portal-mounted dropdowns render consistently.
- Centralized the duplicated reset styles into `src/styles/widget-reset.scss`.
- Upgraded the local tooling baseline to Vite 7, Vitest 4, jsdom 28, and `sass-embedded` 1.97.3.
