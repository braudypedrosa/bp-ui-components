import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bpUISelect } from '../src/alpine/select.js';

function createSelectMarkup(attributes = '') {
  return `
    <div class="bp-ui-select" data-bp-ui-select ${attributes}>
      <button class="bp-ui-select__trigger" type="button">
        <span class="bp-ui-select__trigger-value">Select an option</span>
        <span class="bp-ui-select__trigger-chevron" aria-hidden="true"></span>
      </button>
      <input class="bp-ui-select__input" type="hidden" />
      <div class="bp-ui-select__popover">
        <button class="bp-ui-select__option" type="button" data-value="villa">
          <span class="bp-ui-select__option-label">Villa</span>
          <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
        </button>
        <button class="bp-ui-select__option" type="button" data-value="cabin">
          <span class="bp-ui-select__option-label">Cabin</span>
          <span class="bp-ui-select__option-indicator" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  `;
}

function createRect({ top, left, width, height }) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {
      return this;
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('bpUISelect', () => {
  it('returns the expected Alpine-friendly API surface', () => {
    const select = bpUISelect();

    expect(select).toMatchObject({
      value: '',
      label: '',
      open: false,
      disabled: false,
      size: 'md',
      variant: 'default',
    });
    expect(select.init).toBeTypeOf('function');
    expect(select.toggle).toBeTypeOf('function');
    expect(select.openPopover).toBeTypeOf('function');
    expect(select.closePopover).toBeTypeOf('function');
    expect(select.select).toBeTypeOf('function');
    expect(select.isSelected).toBeTypeOf('function');
  });

  it('infers options from DOM on init and syncs public state', () => {
    document.body.innerHTML = createSelectMarkup('data-value="villa" data-variant="soft"');
    const select = bpUISelect();

    select.$el = document.querySelector('.bp-ui-select');
    select.init();

    expect(select.value).toBe('villa');
    expect(select.label).toBe('Villa');
    expect(select.variant).toBe('soft');
  });

  it('supports wrapper-owned Alpine state while reading the inner select contract', () => {
    document.body.innerHTML = `
      <div data-wrapper>
        ${createSelectMarkup('data-value="cabin"')}
      </div>
    `;
    const select = bpUISelect();

    select.$el = document.querySelector('[data-wrapper]');
    select.init();

    expect(select.value).toBe('cabin');
    expect(select.label).toBe('Cabin');
    expect(document.querySelector('.bp-ui-select__trigger-value').textContent).toBe('Cabin');
  });

  it('keeps selection and open state in sync', () => {
    document.body.innerHTML = createSelectMarkup();
    const select = bpUISelect();

    select.$el = document.querySelector('.bp-ui-select');
    select.init();
    select.openPopover();
    select.select('cabin');
    select.closePopover();

    expect(select.value).toBe('cabin');
    expect(select.label).toBe('Cabin');
    expect(select.open).toBe(false);
    expect(select.isSelected('cabin')).toBe(true);
  });

  it('uses the floating edge-aware popover by default', () => {
    document.body.innerHTML = `
      <div class="relative" data-wrapper>
        ${createSelectMarkup()}
      </div>
    `;
    const select = bpUISelect();
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.classList?.contains('bp-ui-select__trigger')) {
        return createRect({ top: 160, left: 24, width: 220, height: 48 });
      }

      if (this.classList?.contains('bp-ui-select__popover')) {
        return createRect({ top: 0, left: 0, width: 220, height: 120 });
      }

      return originalRect.call(this);
    });

    select.$el = document.querySelector('[data-wrapper]');
    select.init();
    select.openPopover();

    const popover = document.body.querySelector('.bp-ui-select__popover');

    expect(popover).not.toBeNull();
    expect(popover.parentElement).toBe(document.body);
    expect(popover.style.top).toBe('216px');
    expect(popover.style.left).toBe('24px');

    select.closePopover();
    rectSpy.mockRestore();
  });
});
