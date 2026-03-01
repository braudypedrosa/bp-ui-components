# bp-ui Component Standard

`bp-ui-components` is a snippet-first UI library. Every stable component must ship as a copy-paste HTML contract first, with the JavaScript APIs and Alpine adapters supporting that contract rather than replacing it.

## Required Structure

Every component must follow this folder layout:

- `src/core/*` for framework-agnostic state, normalization, and shared logic
- `src/components/*` for vanilla DOM controllers
- `src/alpine/*` for Alpine adapters over the same core state
- `src/styles/*` for library-owned CSS
- `samples/*` for live demos and copy-ready snippets
- `test/*` for state, DOM, and Alpine shape coverage

## Naming Contract

Every component must use the same naming rules:

- Root class: `.bp-ui-{component}`
- Element class: `.bp-ui-{component}__{element}`
- Modifier class: `.bp-ui-{component}--{modifier}`
- Runtime state class: `.is-*`
- DOM hook: `data-bp-ui-{component}`

Do not invent component-specific naming patterns unless there is a strong compatibility reason.

## Delivery Standard

Every stable component release must include:

- a snippet-first vanilla HTML contract
- a vanilla controller with auto-init support
- an Alpine adapter over the same state rules
- library-owned CSS that does not depend on Tailwind
- a sample/demo page
- tests for core state, DOM behavior, and Alpine adapter shape
- README coverage

## Vanilla + Alpine Rule

Every component must support both of these usage modes:

- Vanilla JS with `initBPUI*` auto-init or direct class instantiation
- Tailwind + Alpine wrappers, with Alpine state powered by the shared core logic

Tailwind may frame the outer layout. Tailwind must not be required for the component internals to render or behave correctly.

## Accessibility Minimums

Every component must meet these minimums:

- visible or programmatic labeling
- keyboard support for the primary interaction path
- disabled states reflected in DOM attributes and runtime classes
- semantic form controls when available
- `aria-expanded`, `aria-selected`, `aria-disabled`, and similar attributes when relevant

## Event Standard

Custom events must follow this naming pattern:

- `bp-ui:{component}:{action}`

Event payloads should be flat and explicit. Prefer detail objects like:

```js
{
  value,
  previousValue,
  trigger
}
```

If a component needs richer event detail, add the specific fields directly instead of nesting another object.

## Style Standard

Each component stylesheet should:

- expose component-scoped CSS variables
- support `sm`, `md`, and `lg` sizes where that makes sense
- own the visual treatment of states and variants
- avoid external icon dependencies unless the library explicitly ships them

If a component has multiple visual treatments, prefer modifier classes over separate component names when the behavior contract is the same.

## Test Checklist

Every new component must add:

- state normalization tests
- invalid input tests
- DOM init tests
- user interaction tests
- event payload tests
- destroy/cleanup tests
- Alpine adapter shape tests

## Demo Checklist

Every sample page should include:

- a vanilla live example
- an Alpine + Tailwind example or wrapper
- copy-ready canonical snippets
- a small event or state log when helpful

## Locked Decisions

These are current library standards and should be preserved unless explicitly changed:

- `bp-ui-select` is the official select component name
- `bp-ui-select` should match the visual and interaction baseline from the sibling `bp-search-widget` select before adding library-specific enhancements
- `bp-ui-select` must support robust edge detection
- `bp-ui-radio` is one component with `default` and `pill` variants
- `bp-ui-radio` pill variant should match the sibling `bp-search-widget` pill treatment
- `bp-ui-checkbox` is one component with `default` and `pill` variants
- `bp-ui-checkbox` pill variant should match the sibling `bp-search-widget` pill treatment
- component internals cannot depend on Tailwind
- sample/demo pages are required for stable components
