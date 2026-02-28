# bp-ui-components

Reusable `bp-ui-*` components for future projects, starting with a framework-agnostic counter that works in vanilla JS and Alpine.

## Features

- shared `bp-ui-*` markup contract across vanilla JS and Alpine
- plain CSS component styling with CSS variables
- vanilla auto-init for copy-paste HTML snippets
- Alpine adapter for Tailwind-friendly compositions
- counter events for change and boundary handling

## Installation

```bash
npm install @braudypedrosa/bp-ui-components
```

## Imports

```js
import { initBPUICounters, BPUICounter, bpUICounter } from '@braudypedrosa/bp-ui-components';
import '@braudypedrosa/bp-ui-components/styles';
```

## Vanilla Usage

```html
<div
  class="bp-ui-counter"
  data-bp-ui-counter
  data-value="2"
  data-min="0"
  data-max="10"
  data-step="1"
>
  <div class="bp-ui-counter__label">Seats</div>
  <button
    class="bp-ui-counter__button bp-ui-counter__button--decrement"
    type="button"
    aria-label="Decrease seat count"
  >
    -
  </button>
  <div class="bp-ui-counter__field">
    <input
      class="bp-ui-counter__input"
      type="number"
      inputmode="numeric"
      aria-label="Seat count"
    />
  </div>
  <button
    class="bp-ui-counter__button bp-ui-counter__button--increment"
    type="button"
    aria-label="Increase seat count"
  >
    +
  </button>
  <div class="bp-ui-counter__hint">Vanilla-ready snippet.</div>
  <div class="bp-ui-counter__status" hidden></div>
</div>

<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import { initBPUICounters } from '@braudypedrosa/bp-ui-components';

  initBPUICounters();
</script>
```

## Alpine Usage

```html
<div
  class="bp-ui-counter bp-ui-counter--soft bp-ui-counter--horizontal"
  x-data="window.bpUICounter({ value: 3, min: 1, max: 12, step: 3, variant: 'soft' })"
  x-init="init()"
  role="group"
  aria-label="Guest counter"
  :class="{
    'is-at-min': !canDecrement(),
    'is-at-max': !canIncrement(),
    'is-disabled': disabled,
    'is-loading': loading
  }"
>
  <div class="bp-ui-counter__label">Guests</div>
  <button
    class="bp-ui-counter__button bp-ui-counter__button--decrement"
    type="button"
    aria-label="Decrease guest count"
    @click="decrement()"
    :disabled="!canDecrement()"
  >
    -
  </button>
  <div class="bp-ui-counter__field">
    <input
      class="bp-ui-counter__input"
      type="number"
      inputmode="numeric"
      x-model="inputValue"
      :min="min"
      :max="max"
      :step="step"
      @input="onInput($event)"
      @blur="commitInput($event)"
      @keydown.enter.prevent="commitInput($event)"
      @keydown.arrow-up.prevent="increment()"
      @keydown.arrow-down.prevent="decrement()"
      aria-label="Guest count"
    />
  </div>
  <button
    class="bp-ui-counter__button bp-ui-counter__button--increment"
    type="button"
    aria-label="Increase guest count"
    @click="increment()"
    :disabled="!canIncrement()"
  >
    +
  </button>
  <div class="bp-ui-counter__hint">Works inside Alpine and Tailwind layouts.</div>
  <div class="bp-ui-counter__status" hidden></div>
</div>
```

Load the `bp-ui` module before Alpine starts so `window.bpUICounter` is available to the `x-data` expression.

## Public API

### Exports

- `BPUICounter`
- `initBPUICounters(root = document)`
- `createCounterState(config = {})`
- `bpUICounter(config = {})`

### Browser globals

- `window.BPUICounter`
- `window.BP_UI_Counter`
- `window.initBPUICounters`
- `window.bpUICounter`

### `new BPUICounter(element, options)`

Instance methods:

- `getValue()`
- `setValue(value, trigger = 'api')`
- `increment()`
- `decrement()`
- `enable()`
- `disable()`
- `setLoading(flag)`
- `destroy()`

### Data attributes

- `data-bp-ui-counter`
- `data-value`
- `data-min`
- `data-max`
- `data-step`
- `data-size`
- `data-variant`
- `data-layout`
- `data-disabled`
- `data-loading`

### Events

The vanilla controller dispatches bubbling custom events on the root element:

- `bp-ui:counter:change`
- `bp-ui:counter:min`
- `bp-ui:counter:max`

`bp-ui:counter:change` detail:

```js
{
  value,
  previousValue,
  min,
  max,
  step,
  trigger
}
```

`trigger` values:

- `'increment'`
- `'decrement'`
- `'input'`
- `'api'`

## Styling Variables

The counter exposes these CSS variables on `.bp-ui-counter`:

- `--bp-ui-counter-bg`
- `--bp-ui-counter-border`
- `--bp-ui-counter-text`
- `--bp-ui-counter-muted`
- `--bp-ui-counter-accent`
- `--bp-ui-counter-accent-contrast`
- `--bp-ui-counter-radius`
- `--bp-ui-counter-height`
- `--bp-ui-counter-gap`
- `--bp-ui-counter-shadow`

## Local Demo

The first component demo lives at [`samples/counter.html`](/Users/braudypedorsa/Projects/libraries/bp-ui-components/samples/counter.html).

Run locally:

```bash
npm install
npm run dev
```

## Development

```bash
npm run test
npm run build
```

## Roadmap

Future `bp-ui` components should reuse the same library pattern:

- framework-agnostic core behavior
- `bp-ui-*` prefixed markup
- ready-made HTML snippets first
- optional framework adapters where they add real value

## License

MIT
