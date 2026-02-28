import { beforeEach, describe, expect, it } from 'vitest';
import { BPUICounter, initBPUICounters } from '../src/components/counter.js';

function createCounterMarkup(attributes = '') {
  return `
    <div class="bp-ui-counter" data-bp-ui-counter ${attributes}>
      <div class="bp-ui-counter__label">Quantity</div>
      <button class="bp-ui-counter__button bp-ui-counter__button--decrement" type="button" aria-label="Decrease quantity">-</button>
      <div class="bp-ui-counter__field">
        <input class="bp-ui-counter__input" type="number" inputmode="numeric" aria-label="Quantity input" />
      </div>
      <button class="bp-ui-counter__button bp-ui-counter__button--increment" type="button" aria-label="Increase quantity">+</button>
      <div class="bp-ui-counter__hint">Counter helper text</div>
      <div class="bp-ui-counter__status" hidden></div>
    </div>
  `;
}

describe('BPUICounter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('auto-initializes only eligible roots once', () => {
    document.body.innerHTML = `
      ${createCounterMarkup('data-value="1"')}
      ${createCounterMarkup('data-value="4"')}
    `;

    const firstPass = initBPUICounters();
    const secondPass = initBPUICounters();

    expect(firstPass).toHaveLength(2);
    expect(secondPass).toHaveLength(0);
    expect(firstPass[0].getValue()).toBe(1);
    expect(firstPass[1].getValue()).toBe(4);
  });

  it('updates the input value when buttons are clicked', () => {
    document.body.innerHTML = createCounterMarkup('data-value="2" data-max="4"');
    const root = document.querySelector('.bp-ui-counter');
    const counter = new BPUICounter(root);
    const input = root.querySelector('.bp-ui-counter__input');
    const incrementButton = root.querySelector('.bp-ui-counter__button--increment');

    incrementButton.click();
    incrementButton.click();

    expect(counter.getValue()).toBe(4);
    expect(input.value).toBe('4');
  });

  it('commits direct input on blur and enter', () => {
    document.body.innerHTML = createCounterMarkup('data-value="2" data-max="8"');
    const root = document.querySelector('.bp-ui-counter');
    new BPUICounter(root);
    const input = root.querySelector('.bp-ui-counter__input');

    input.value = '7';
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    expect(input.value).toBe('7');

    input.value = '99';
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    expect(input.value).toBe('8');
  });

  it('disables boundary buttons correctly', () => {
    document.body.innerHTML = createCounterMarkup('data-value="0" data-min="0" data-max="1"');
    const root = document.querySelector('.bp-ui-counter');
    new BPUICounter(root);
    const decrementButton = root.querySelector('.bp-ui-counter__button--decrement');
    const incrementButton = root.querySelector('.bp-ui-counter__button--increment');

    expect(decrementButton.disabled).toBe(true);
    expect(incrementButton.disabled).toBe(false);

    incrementButton.click();

    expect(incrementButton.disabled).toBe(true);
    expect(root.classList.contains('is-at-max')).toBe(true);
  });

  it('dispatches counter events with the expected detail payload', () => {
    document.body.innerHTML = createCounterMarkup('data-value="1" data-max="2"');
    const root = document.querySelector('.bp-ui-counter');
    const counter = new BPUICounter(root);
    const events = [];

    root.addEventListener('bp-ui:counter:change', (event) => events.push(event));
    root.addEventListener('bp-ui:counter:max', (event) => events.push(event));

    counter.increment();

    expect(events).toHaveLength(2);
    expect(events[0].detail).toMatchObject({
      value: 2,
      previousValue: 1,
      min: null,
      max: 2,
      step: 1,
      trigger: 'increment',
    });
    expect(events[1].type).toBe('bp-ui:counter:max');
  });

  it('removes listeners on destroy', () => {
    document.body.innerHTML = createCounterMarkup('data-value="3"');
    const root = document.querySelector('.bp-ui-counter');
    const counter = new BPUICounter(root);
    const incrementButton = root.querySelector('.bp-ui-counter__button--increment');

    counter.destroy();
    incrementButton.click();

    expect(counter.getValue()).toBe(3);
  });

  it('reads data attributes and lets constructor options override them', () => {
    document.body.innerHTML = createCounterMarkup('data-value="1" data-min="0" data-max="3" data-step="1"');
    const root = document.querySelector('.bp-ui-counter');
    const counter = new BPUICounter(root, {
      value: 5,
      max: 8,
      step: 3,
    });

    expect(counter.getValue()).toBe(5);

    counter.increment();

    expect(counter.getValue()).toBe(8);
  });
});
