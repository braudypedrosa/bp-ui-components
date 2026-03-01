import { beforeEach, describe, expect, it } from 'vitest';
import { BPUICheckboxGroup, initBPUICheckboxes } from '../src/components/checkbox.js';

function createCheckboxMarkup(attributes = '') {
  return `
    <div class="bp-ui-checkbox" data-bp-ui-checkbox ${attributes}>
      <div class="bp-ui-checkbox__label">Amenities</div>
      <div class="bp-ui-checkbox__group">
        <label class="bp-ui-checkbox__option">
          <input class="bp-ui-checkbox__input" type="checkbox" value="pool" />
          <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
          <span class="bp-ui-checkbox__content">
            <span class="bp-ui-checkbox__header">
              <span class="bp-ui-checkbox__option-label">Pool</span>
            </span>
            <span class="bp-ui-checkbox__sublabel">Open until 10 PM.</span>
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
            <span class="bp-ui-checkbox__sublabel">Book in advance.</span>
          </span>
        </label>
        <label class="bp-ui-checkbox__option">
          <input class="bp-ui-checkbox__input" type="checkbox" value="gym" disabled />
          <span class="bp-ui-checkbox__control" aria-hidden="true"></span>
          <span class="bp-ui-checkbox__content">
            <span class="bp-ui-checkbox__header">
              <span class="bp-ui-checkbox__option-label">Gym</span>
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

describe('BPUICheckboxGroup', () => {
  it('auto-initializes eligible roots only once', () => {
    document.body.innerHTML = `
      ${createCheckboxMarkup('data-values="pool"')}
      ${createCheckboxMarkup('data-values="spa"')}
    `;

    const firstPass = initBPUICheckboxes();
    const secondPass = initBPUICheckboxes();

    expect(firstPass).toHaveLength(2);
    expect(secondPass).toHaveLength(0);
    expect(firstPass[0].getValues()).toEqual(['pool']);
    expect(firstPass[1].getValues()).toEqual(['spa']);
  });

  it('throws when required DOM elements are missing', () => {
    document.body.innerHTML = `
      <div class="bp-ui-checkbox" data-bp-ui-checkbox></div>
    `;

    expect(() => new BPUICheckboxGroup(document.querySelector('.bp-ui-checkbox'))).toThrow(/requires at least one/i);
  });

  it('reads data attributes and lets constructor options override them', () => {
    document.body.innerHTML = createCheckboxMarkup('data-values="pool,spa" data-variant="pill"');
    const root = document.querySelector('.bp-ui-checkbox');
    const checkbox = new BPUICheckboxGroup(root, {
      values: ['spa'],
      size: 'sm',
    });

    expect(checkbox.getValues()).toEqual(['spa']);
    expect(root.classList.contains('bp-ui-checkbox--pill')).toBe(true);
    expect(root.classList.contains('bp-ui-checkbox--sm')).toBe(true);
  });

  it('dispatches checkbox change events with expected detail', () => {
    document.body.innerHTML = createCheckboxMarkup('data-values="pool"');
    const root = document.querySelector('.bp-ui-checkbox');
    const checkbox = new BPUICheckboxGroup(root);
    const events = [];

    root.addEventListener('bp-ui:checkbox:change', (event) => events.push(event));

    checkbox.toggleValue('spa');

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({
      values: ['pool', 'spa'],
      previousValues: ['pool'],
      value: 'spa',
      checked: true,
      trigger: 'api',
    });
  });

  it('syncs selected classes and inputs on native changes', () => {
    document.body.innerHTML = createCheckboxMarkup('data-values="pool"');
    const root = document.querySelector('.bp-ui-checkbox');
    new BPUICheckboxGroup(root);
    const spaInput = root.querySelector('.bp-ui-checkbox__input[value="spa"]');

    spaInput.checked = true;
    spaInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(root.querySelector('.bp-ui-checkbox__option:nth-child(2)').classList.contains('is-selected')).toBe(true);
  });

  it('propagates the root name and disabled state', () => {
    document.body.innerHTML = createCheckboxMarkup('data-name="amenities" data-disabled');
    const root = document.querySelector('.bp-ui-checkbox');
    new BPUICheckboxGroup(root);

    const inputs = Array.from(root.querySelectorAll('.bp-ui-checkbox__input'));
    expect(inputs.every((input) => input.name === 'amenities')).toBe(true);
    expect(inputs.every((input) => input.disabled)).toBe(true);
  });

  it('supports clearing and destroy cleanup', () => {
    document.body.innerHTML = createCheckboxMarkup('data-values="pool,spa"');
    const root = document.querySelector('.bp-ui-checkbox');
    const checkbox = new BPUICheckboxGroup(root);

    checkbox.clear();
    expect(checkbox.getValues()).toEqual([]);

    checkbox.destroy();
    root.querySelector('.bp-ui-checkbox__input[value="pool"]').checked = true;
    root.querySelector('.bp-ui-checkbox__input[value="pool"]').dispatchEvent(new Event('change', { bubbles: true }));
    expect(checkbox.getValues()).toEqual([]);
  });
});
