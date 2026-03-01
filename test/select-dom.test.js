import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BPUISelect, initBPUISelects } from '../src/components/select.js';

function createSelectMarkup(attributes = '') {
  return `
    <div class="bp-ui-select" data-bp-ui-select ${attributes}>
      <div class="bp-ui-select__label">Property Type</div>
      <button class="bp-ui-select__trigger" type="button" aria-haspopup="listbox">
        <span class="bp-ui-select__trigger-value">Select an option</span>
        <span class="bp-ui-select__trigger-chevron" aria-hidden="true"></span>
      </button>
      <input class="bp-ui-select__input" type="hidden" name="propertyType" />
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
      <div class="bp-ui-select__hint">Single select with popover positioning.</div>
      <div class="bp-ui-select__status" hidden></div>
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

describe('BPUISelect', () => {
  it('auto-initializes eligible roots only once', () => {
    document.body.innerHTML = `
      ${createSelectMarkup('data-value="villa"')}
      ${createSelectMarkup('data-value="suite"')}
    `;

    const firstPass = initBPUISelects();
    const secondPass = initBPUISelects();

    expect(firstPass).toHaveLength(2);
    expect(secondPass).toHaveLength(0);
    expect(firstPass[0].getValue()).toBe('villa');
    expect(firstPass[1].getValue()).toBe('suite');
  });

  it('throws when required DOM elements are missing', () => {
    document.body.innerHTML = `
      <div class="bp-ui-select" data-bp-ui-select>
        <input class="bp-ui-select__input" type="hidden" />
      </div>
    `;

    expect(() => new BPUISelect(document.querySelector('.bp-ui-select'))).toThrow(/Missing required select element/);
  });

  it('reads data attributes and lets constructor options override them', () => {
    document.body.innerHTML = createSelectMarkup('data-value="villa" data-placeholder="Choose one" data-size="lg" data-variant="soft"');
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root, {
      value: 'cabin',
      size: 'sm',
    });

    expect(select.getValue()).toBe('cabin');
    expect(root.classList.contains('bp-ui-select--sm')).toBe(true);
    expect(root.querySelector('.bp-ui-select__trigger-value').textContent).toBe('Cabin');
  });

  it('keeps the hidden input and selected label in sync', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const input = root.querySelector('.bp-ui-select__input');
    const option = root.querySelector('.bp-ui-select__option[data-value="suite"]');

    select.open();
    option.click();

    expect(select.getValue()).toBe('suite');
    expect(input.value).toBe('suite');
    expect(root.querySelector('.bp-ui-select__trigger-value').textContent).toBe('Suite');
  });

  it('dispatches select change events with the expected detail', () => {
    document.body.innerHTML = createSelectMarkup('data-value="villa"');
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const events = [];

    root.addEventListener('bp-ui:select:change', (event) => events.push(event));

    select.setValue('cabin');

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({
      value: 'cabin',
      previousValue: 'villa',
      label: 'Cabin',
      previousLabel: 'Villa',
      trigger: 'api',
    });
  });

  it('dispatches open and close events', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const events = [];

    root.addEventListener('bp-ui:select:open', (event) => events.push(event.type));
    root.addEventListener('bp-ui:select:close', (event) => events.push(event.type));

    select.open();
    select.close();

    expect(events).toEqual(['bp-ui:select:open', 'bp-ui:select:close']);
  });

  it('portals the popover to the document body while open and restores it on close', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const popover = root.querySelector('.bp-ui-select__popover');

    select.open();
    expect(popover.parentElement).toBe(document.body);

    select.close();
    expect(root.querySelector('.bp-ui-select__popover')).toBe(popover);
  });

  it('keeps size and variant classes on the portaled popover', () => {
    document.body.innerHTML = createSelectMarkup('data-size="lg" data-variant="soft"');
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);

    select.open();

    const popover = document.body.querySelector('.bp-ui-select__popover');

    expect(popover.classList.contains('bp-ui-select--lg')).toBe(true);
    expect(popover.classList.contains('bp-ui-select--soft')).toBe(true);
  });

  it('closes when clicking outside the component', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    new BPUISelect(root);
    const trigger = root.querySelector('.bp-ui-select__trigger');

    trigger.click();
    expect(root.classList.contains('is-open')).toBe(true);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(root.classList.contains('is-open')).toBe(false);
  });

  it('supports keyboard navigation, selection, and escape focus restore', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const trigger = root.querySelector('.bp-ui-select__trigger');
    const popover = root.querySelector('.bp-ui-select__popover');

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    popover.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    popover.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));

    expect(select.getValue()).toBe('cabin');
    expect(root.classList.contains('is-open')).toBe(false);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    popover.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));

    expect(document.activeElement).toBe(trigger);
    expect(root.classList.contains('is-open')).toBe(false);
  });

  it('removes listeners on destroy', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const trigger = root.querySelector('.bp-ui-select__trigger');

    select.destroy();
    trigger.click();

    expect(root.classList.contains('is-open')).toBe(false);
  });

  it('opens upward and limits height when there is not enough room below', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.classList?.contains('bp-ui-select__trigger')) {
        return createRect({ top: 520, left: 24, width: 280, height: 48 });
      }

      if (this.classList?.contains('bp-ui-select__popover')) {
        return createRect({ top: 0, left: 0, width: 280, height: 220 });
      }

      return originalRect.call(this);
    });
    const innerHeightSpy = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(640);

    select.open();

    const popover = document.body.querySelector('.bp-ui-select__popover');

    expect(root.classList.contains('bp-ui-select--above')).toBe(true);
    expect(popover.style.maxHeight).toBe('496px');
    expect(Number.parseInt(popover.style.top, 10)).toBe(292);

    innerHeightSpy.mockRestore();
    rectSpy.mockRestore();
  });

  it('clamps the popover against the viewport left edge', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.classList?.contains('bp-ui-select__trigger')) {
        return createRect({ top: 80, left: 4, width: 180, height: 48 });
      }

      if (this.classList?.contains('bp-ui-select__popover')) {
        return createRect({ top: 0, left: 0, width: 240, height: 180 });
      }

      return originalRect.call(this);
    });
    const innerWidthSpy = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(420);

    select.open();

    expect(document.body.querySelector('.bp-ui-select__popover').style.left).toBe('16px');

    innerWidthSpy.mockRestore();
    rectSpy.mockRestore();
  });

  it('clamps the popover against the viewport right edge', () => {
    document.body.innerHTML = createSelectMarkup();
    const root = document.querySelector('.bp-ui-select');
    const select = new BPUISelect(root);
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect() {
      if (this.classList?.contains('bp-ui-select__trigger')) {
        return createRect({ top: 80, left: 300, width: 100, height: 48 });
      }

      if (this.classList?.contains('bp-ui-select__popover')) {
        return createRect({ top: 0, left: 0, width: 220, height: 180 });
      }

      return originalRect.call(this);
    });
    const innerWidthSpy = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(420);

    select.open();

    expect(document.body.querySelector('.bp-ui-select__popover').style.left).toBe('184px');

    innerWidthSpy.mockRestore();
    rectSpy.mockRestore();
  });
});
