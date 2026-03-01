import { beforeEach, describe, expect, it } from 'vitest';
import { bpUICheckbox } from '../src/alpine/checkbox.js';

function createCheckboxMarkup(attributes = '') {
  return `
    <div class="bp-ui-checkbox" data-bp-ui-checkbox ${attributes}>
      <div class="bp-ui-checkbox__group">
        <label class="bp-ui-checkbox__option">
          <input class="bp-ui-checkbox__input" type="checkbox" value="pool" />
          <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
          <span class="bp-ui-checkbox__content">
            <span class="bp-ui-checkbox__header">
              <span class="bp-ui-checkbox__option-label">Pool</span>
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
  `;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('bpUICheckbox', () => {
  it('returns the expected Alpine-friendly API surface', () => {
    const checkbox = bpUICheckbox();

    expect(checkbox).toMatchObject({
      values: [],
      disabled: false,
      size: 'md',
      variant: 'default',
    });
    expect(checkbox.init).toBeTypeOf('function');
    expect(checkbox.toggle).toBeTypeOf('function');
    expect(checkbox.setValues).toBeTypeOf('function');
    expect(checkbox.clear).toBeTypeOf('function');
    expect(checkbox.isSelected).toBeTypeOf('function');
  });

  it('infers options from DOM on init and syncs public state', () => {
    document.body.innerHTML = createCheckboxMarkup('data-values="spa" data-variant="pill"');
    const checkbox = bpUICheckbox();

    checkbox.$el = document.querySelector('.bp-ui-checkbox');
    checkbox.init();

    expect(checkbox.values).toEqual(['spa']);
    expect(checkbox.variant).toBe('pill');
  });

  it('supports wrapper-owned Alpine state while reading the inner checkbox contract', () => {
    document.body.innerHTML = `
      <div data-wrapper>
        ${createCheckboxMarkup('data-values="spa"')}
      </div>
    `;
    const checkbox = bpUICheckbox();

    checkbox.$el = document.querySelector('[data-wrapper]');
    checkbox.init();
    checkbox.toggle('pool');

    expect(checkbox.values).toEqual(['spa', 'pool']);
    expect(document.querySelector('.bp-ui-checkbox__input[value="pool"]').checked).toBe(true);
  });

  it('syncs public values when native inputs change', () => {
    document.body.innerHTML = `
      <div data-wrapper>
        ${createCheckboxMarkup('data-values="spa"')}
      </div>
    `;
    const checkbox = bpUICheckbox();
    const poolInput = document.querySelector('.bp-ui-checkbox__input[value="pool"]');

    checkbox.$el = document.querySelector('[data-wrapper]');
    checkbox.init();

    poolInput.checked = true;
    poolInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(checkbox.values).toEqual(['spa', 'pool']);
    expect(checkbox.isSelected('pool')).toBe(true);
  });
});
