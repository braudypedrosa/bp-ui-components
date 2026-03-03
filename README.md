# bp-ui-components

`bp-ui-components` is a snippet-first `bp-ui` UI kit for reusable form and interaction components that work in vanilla JS and Alpine.

Current stable components:

- `bp-ui-counter`
- `bp-ui-select`
- `bp-ui-radio`
- `bp-ui-checkbox`

## Install

```bash
npm install @braudypedrosa/bp-ui-components
```

## Standards

The library-wide implementation contract lives in [COMPONENT_STANDARD.md](./COMPONENT_STANDARD.md).

That standard is the source of truth for:

- naming
- folder structure
- vanilla + Alpine support
- event shape
- accessibility minimums
- test/demo requirements

## Maintainer Workflow

For the reusable release workflow, versioning rules, and verification steps, see [RELEASING.md](./RELEASING.md).

## Package Exports

### JS exports

- `BPUICounter`
- `initBPUICounters(root = document)`
- `createCounterState(config = {})`
- `bpUICounter(config = {})`
- `BPUISelect`
- `initBPUISelects(root = document)`
- `createSelectState(config = {})`
- `bpUISelect(config = {})`
- `BPUIRadioGroup`
- `initBPUIRadios(root = document)`
- `createRadioState(config = {})`
- `bpUIRadio(config = {})`
- `BPUICheckboxGroup`
- `initBPUICheckboxes(root = document)`
- `createCheckboxState(config = {})`
- `bpUICheckbox(config = {})`

### Browser globals

- `window.BPUICounter`
- `window.BP_UI_Counter`
- `window.initBPUICounters`
- `window.bpUICounter`
- `window.BPUISelect`
- `window.BP_UI_Select`
- `window.initBPUISelects`
- `window.bpUISelect`
- `window.BPUIRadioGroup`
- `window.BP_UI_RadioGroup`
- `window.initBPUIRadios`
- `window.bpUIRadio`
- `window.BPUICheckboxGroup`
- `window.BP_UI_CheckboxGroup`
- `window.initBPUICheckboxes`
- `window.bpUICheckbox`

### CSS entry points

- `@braudypedrosa/bp-ui-components/styles`
- `@braudypedrosa/bp-ui-components/styles/counter.css`
- `@braudypedrosa/bp-ui-components/styles/select.css`
- `@braudypedrosa/bp-ui-components/styles/radio.css`
- `@braudypedrosa/bp-ui-components/styles/checkbox.css`
- `@braudypedrosa/bp-ui-components/styles/widget-reset.css`

The full `@braudypedrosa/bp-ui-components/styles` bundle already includes the shared widget reset.
If you import a component stylesheet directly, also import `widget-reset.css` unless another BP package
already includes it for that surface.

## Canonical Usage

### `bp-ui-counter` vanilla

```html
<div
  class="bp-ui-counter"
  data-bp-ui-counter
  data-value="2"
  data-min="0"
  data-max="8"
  data-step="1"
>
  <div class="bp-ui-counter__label">Seats</div>
  <button class="bp-ui-counter__button bp-ui-counter__button--decrement" type="button" aria-label="Decrease seat count">-</button>
  <div class="bp-ui-counter__field">
    <input class="bp-ui-counter__input" type="number" inputmode="numeric" aria-label="Seat count" />
  </div>
  <button class="bp-ui-counter__button bp-ui-counter__button--increment" type="button" aria-label="Increase seat count">+</button>
  <div class="bp-ui-counter__hint">Shared markup, no framework required.</div>
  <div class="bp-ui-counter__status" hidden></div>
</div>

<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import { initBPUICounters } from '@braudypedrosa/bp-ui-components';

  initBPUICounters();
</script>
```

### `bp-ui-select` vanilla

```html
<div class="bp-ui-select" data-bp-ui-select data-placeholder="Choose a property type" data-name="propertyType">
  <div class="bp-ui-select__label">Property Type</div>
  <button class="bp-ui-select__trigger" type="button" aria-haspopup="listbox">
    <span class="bp-ui-select__trigger-value">Choose a property type</span>
    <span class="bp-ui-select__trigger-chevron" aria-hidden="true"></span>
  </button>
  <input class="bp-ui-select__input" type="hidden" />
  <div class="bp-ui-select__popover" role="listbox">
    <button class="bp-ui-select__option" type="button" data-value="villa">
      <span class="bp-ui-select__option-label">Villa</span>
      <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
    </button>
    <button class="bp-ui-select__option" type="button" data-value="cabin">
      <span class="bp-ui-select__option-label">Cabin</span>
      <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
    </button>
    <button class="bp-ui-select__option" type="button" data-value="suite">
      <span class="bp-ui-select__option-label">Suite</span>
      <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
    </button>
  </div>
  <div class="bp-ui-select__hint">Viewport-aware single select.</div>
  <div class="bp-ui-select__status" hidden></div>
</div>

<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import { initBPUISelects } from '@braudypedrosa/bp-ui-components';

  initBPUISelects();
</script>
```

### `bp-ui-select` Alpine + Tailwind wrapper

```html
<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import '@braudypedrosa/bp-ui-components';
</script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div
  class="relative rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
  x-data="window.bpUISelect()"
  x-init="init()"
>
  <div class="bp-ui-select" data-value="cabin">
    <div class="bp-ui-select__label">Property Type</div>
    <button class="bp-ui-select__trigger" type="button" @click="toggle()">
      <span class="bp-ui-select__trigger-value">Cabin</span>
      <span class="bp-ui-select__trigger-chevron" aria-hidden="true"></span>
    </button>
    <input class="bp-ui-select__input" type="hidden" value="cabin" />
    <div class="bp-ui-select__popover" hidden>
      <button class="bp-ui-select__option" type="button" data-value="villa" @click="select($event.currentTarget.dataset.value, 'option'); closePopover()">
        <span class="bp-ui-select__option-label">Villa</span>
        <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
      </button>
      <button class="bp-ui-select__option is-selected" type="button" data-value="cabin" @click="select($event.currentTarget.dataset.value, 'option'); closePopover()">
        <span class="bp-ui-select__option-label">Cabin</span>
        <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
      </button>
      <button class="bp-ui-select__option" type="button" data-value="suite" @click="select($event.currentTarget.dataset.value, 'option'); closePopover()">
        <span class="bp-ui-select__option-label">Suite</span>
        <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</div>
```

Add `.bp-ui-select__popover--local` only when a wrapper intentionally wants local absolute positioning instead of the default viewport-aware floating behavior.

### `bp-ui-radio` default variant

```html
<div class="bp-ui-radio" data-bp-ui-radio data-name="notificationPreference" data-value="push">
  <div class="bp-ui-radio__label">Notification Preference</div>
  <div class="bp-ui-radio__group">
    <label class="bp-ui-radio__option">
      <input class="bp-ui-radio__input" type="radio" value="email" />
      <span class="bp-ui-radio__control" aria-hidden="true"></span>
      <span class="bp-ui-radio__content">
        <span class="bp-ui-radio__header">
          <span class="bp-ui-radio__option-label">Email Summary</span>
        </span>
        <span class="bp-ui-radio__sublabel">Receive a daily digest of all activity.</span>
      </span>
    </label>
    <label class="bp-ui-radio__option">
      <input class="bp-ui-radio__input" type="radio" value="push" />
      <span class="bp-ui-radio__control" aria-hidden="true"></span>
      <span class="bp-ui-radio__content">
        <span class="bp-ui-radio__header">
          <span class="bp-ui-radio__option-label">Real-time Push</span>
          <span class="bp-ui-radio__tag">Recommended</span>
        </span>
        <span class="bp-ui-radio__sublabel">Get instant mobile notifications.</span>
      </span>
    </label>
  </div>
  <div class="bp-ui-radio__hint">One group, native radios, shared library styling.</div>
  <div class="bp-ui-radio__status" hidden></div>
</div>

<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import { initBPUIRadios } from '@braudypedrosa/bp-ui-components';

  initBPUIRadios();
</script>
```

### `bp-ui-radio` pill variant

```html
<div class="bp-ui-radio bp-ui-radio--pill" data-bp-ui-radio data-variant="pill" data-name="view" data-value="ocean">
  <div class="bp-ui-radio__label">View</div>
  <div class="bp-ui-radio__group">
    <label class="bp-ui-radio__option">
      <input class="bp-ui-radio__input" type="radio" value="ocean" />
      <span class="bp-ui-radio__control" aria-hidden="true"></span>
      <span class="bp-ui-radio__content">
        <span class="bp-ui-radio__header">
          <span class="bp-ui-radio__option-label">Ocean</span>
        </span>
      </span>
    </label>
    <label class="bp-ui-radio__option">
      <input class="bp-ui-radio__input" type="radio" value="garden" />
      <span class="bp-ui-radio__control" aria-hidden="true"></span>
      <span class="bp-ui-radio__content">
        <span class="bp-ui-radio__header">
          <span class="bp-ui-radio__option-label">Garden</span>
        </span>
      </span>
    </label>
  </div>
</div>
```

### `bp-ui-radio` Alpine + Tailwind wrapper

```html
<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import '@braudypedrosa/bp-ui-components';
</script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div
  class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
  x-data="window.bpUIRadio()"
  x-init="init()"
>
  <div class="bp-ui-radio" data-name="notificationPreference" data-value="push">
    <div class="bp-ui-radio__label">Notification Preference</div>
    <div class="bp-ui-radio__group">
      <label class="bp-ui-radio__option">
        <input class="bp-ui-radio__input" type="radio" value="email" />
        <span class="bp-ui-radio__control" aria-hidden="true"></span>
        <span class="bp-ui-radio__content">
          <span class="bp-ui-radio__header">
            <span class="bp-ui-radio__option-label">Email Summary</span>
          </span>
        </span>
      </label>
      <label class="bp-ui-radio__option">
        <input class="bp-ui-radio__input" type="radio" value="push" checked />
        <span class="bp-ui-radio__control" aria-hidden="true"></span>
        <span class="bp-ui-radio__content">
          <span class="bp-ui-radio__header">
            <span class="bp-ui-radio__option-label">Real-time Push</span>
          </span>
          <span class="bp-ui-radio__sublabel">Get instant mobile notifications.</span>
        </span>
      </label>
    </div>
  </div>
</div>
```

### `bp-ui-checkbox` default variant

```html
<div class="bp-ui-checkbox" data-bp-ui-checkbox data-name="amenities" data-values="pool,spa">
  <div class="bp-ui-checkbox__label">Amenities</div>
  <div class="bp-ui-checkbox__group">
    <label class="bp-ui-checkbox__option">
      <input class="bp-ui-checkbox__input" type="checkbox" value="pool" />
      <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
      <span class="bp-ui-checkbox__content">
        <span class="bp-ui-checkbox__header">
          <span class="bp-ui-checkbox__option-label">Pool Access</span>
        </span>
        <span class="bp-ui-checkbox__sublabel">Outdoor pool with late-evening access.</span>
      </span>
    </label>
    <label class="bp-ui-checkbox__option">
      <input class="bp-ui-checkbox__input" type="checkbox" value="spa" />
      <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
      <span class="bp-ui-checkbox__content">
        <span class="bp-ui-checkbox__header">
          <span class="bp-ui-checkbox__option-label">Spa</span>
          <span class="bp-ui-checkbox__tag">Popular</span>
        </span>
        <span class="bp-ui-checkbox__sublabel">Thermal rooms and massage availability.</span>
      </span>
    </label>
  </div>
</div>
```

### `bp-ui-checkbox` pill variant

```html
<div class="bp-ui-checkbox bp-ui-checkbox--pill" data-bp-ui-checkbox data-variant="pill" data-name="views" data-values="ocean,garden">
  <div class="bp-ui-checkbox__label">Preferred Features</div>
  <div class="bp-ui-checkbox__group">
    <label class="bp-ui-checkbox__option">
      <input class="bp-ui-checkbox__input" type="checkbox" value="ocean" />
      <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
      <span class="bp-ui-checkbox__content">
        <span class="bp-ui-checkbox__header">
          <span class="bp-ui-checkbox__option-label">Ocean View</span>
        </span>
      </span>
    </label>
    <label class="bp-ui-checkbox__option">
      <input class="bp-ui-checkbox__input" type="checkbox" value="garden" />
      <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
      <span class="bp-ui-checkbox__content">
        <span class="bp-ui-checkbox__header">
          <span class="bp-ui-checkbox__option-label">Garden</span>
        </span>
      </span>
    </label>
  </div>
</div>
```

### `bp-ui-checkbox` Alpine + Tailwind wrapper

```html
<script type="module">
  import '@braudypedrosa/bp-ui-components/styles';
  import '@braudypedrosa/bp-ui-components';
</script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div
  class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
  x-data="window.bpUICheckbox()"
  x-init="init()"
>
  <div class="bp-ui-checkbox" data-name="amenities" data-values="spa">
    <div class="bp-ui-checkbox__label">Amenities</div>
    <div class="bp-ui-checkbox__group">
      <label class="bp-ui-checkbox__option">
        <input class="bp-ui-checkbox__input" type="checkbox" value="pool" />
        <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
        <span class="bp-ui-checkbox__content">
          <span class="bp-ui-checkbox__header">
            <span class="bp-ui-checkbox__option-label">Pool Access</span>
          </span>
        </span>
      </label>
      <label class="bp-ui-checkbox__option">
        <input class="bp-ui-checkbox__input" type="checkbox" value="spa" checked />
        <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
        <span class="bp-ui-checkbox__content">
          <span class="bp-ui-checkbox__header">
            <span class="bp-ui-checkbox__option-label">Spa</span>
          </span>
        </span>
      </label>
    </div>
  </div>
</div>
```

## `bp-ui-select` Public Contract

### Stable DOM interface

- `.bp-ui-select`
- `.bp-ui-select__label`
- `.bp-ui-select__trigger`
- `.bp-ui-select__trigger-value`
- `.bp-ui-select__trigger-chevron`
- `.bp-ui-select__input`
- `.bp-ui-select__popover`
- `.bp-ui-select__option`
- `.bp-ui-select__option-label`
- `.bp-ui-select__option-indicator`
- `.bp-ui-select__hint`
- `.bp-ui-select__status`

### Runtime state classes

- `.is-open`
- `.is-disabled`
- `.is-selected`
- `.is-highlighted`

### Data attributes

- `data-bp-ui-select`
- `data-value`
- `data-placeholder`
- `data-name`
- `data-size`
- `data-variant`
- `data-disabled`

### Vanilla events

- `bp-ui:select:change`
- `bp-ui:select:open`
- `bp-ui:select:close`

`bp-ui:select:change` detail shape:

```js
{
  value,
  previousValue,
  label,
  previousLabel,
  trigger
}
```

`trigger` is one of:

- `'option'`
- `'keyboard'`
- `'api'`

### Instance methods

- `getValue()`
- `setValue(value, trigger = 'api')`
- `open()`
- `close()`
- `toggle()`
- `enable()`
- `disable()`
- `destroy()`

## `bp-ui-radio` Public Contract

### Stable DOM interface

- `.bp-ui-radio`
- `.bp-ui-radio__label`
- `.bp-ui-radio__group`
- `.bp-ui-radio__option`
- `.bp-ui-radio__input`
- `.bp-ui-radio__control`
- `.bp-ui-radio__content`
- `.bp-ui-radio__option-label`
- `.bp-ui-radio__sublabel`
- `.bp-ui-radio__tag`
- `.bp-ui-radio__hint`
- `.bp-ui-radio__status`

### Runtime state classes

- `.is-selected`
- `.is-disabled`

### Data attributes

- `data-bp-ui-radio`
- `data-value`
- `data-name`
- `data-size`
- `data-variant`
- `data-disabled`

### Vanilla events

- `bp-ui:radio:change`

`bp-ui:radio:change` detail shape:

```js
{
  value,
  previousValue,
  trigger
}
```

`trigger` is one of:

- `'input'`
- `'api'`

### Instance methods

- `getValue()`
- `setValue(value, trigger = 'api')`
- `enable()`
- `disable()`
- `destroy()`

## Local Demos

- [Counter demo](./samples/counter.html)
- [Select demo](./samples/select.html)
- [Radio demo](./samples/radio.html)
- [Checkbox demo](./samples/checkbox.html)
- [Original radio reference](./samples/references/radio-reference.html)

## Development

```bash
npm run test
npm run build
```

## Release Strategy

`bp-ui-components` should be distributed through npm as the canonical install path.

Versioning policy:

- `0.1.0` is the initial public counter release.
- additive component releases should move the minor version forward
- patch releases stay within the current minor when fixing bugs or improving an already shipped widget without introducing a new component

Release gate for `1.0.0`:

- do not ship `1.0.0` until the library has at least 8 stable widgets
- each widget should follow the shared library pattern from [COMPONENT_STANDARD.md](./COMPONENT_STANDARD.md)
