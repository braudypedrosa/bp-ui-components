import { beforeEach, describe, expect, it } from 'vitest';
import { BPUIRadioGroup, initBPUIRadios } from '../src/components/radio.js';

function createRadioMarkup(attributes = '', variantClass = '') {
  return `
    <div class="bp-ui-radio ${variantClass}" data-bp-ui-radio ${attributes}>
      <div class="bp-ui-radio__label">Notification Preference</div>
      <div class="bp-ui-radio__group">
        <label class="bp-ui-radio__option">
          <input class="bp-ui-radio__input" type="radio" value="email" />
          <span class="bp-ui-radio__control" aria-hidden="true"></span>
          <span class="bp-ui-radio__content">
            <span class="bp-ui-radio__header">
              <span class="bp-ui-radio__option-label">Email Summary</span>
            </span>
            <span class="bp-ui-radio__sublabel">Receive a daily digest.</span>
          </span>
        </label>
        <label class="bp-ui-radio__option">
          <input class="bp-ui-radio__input" type="radio" value="push" checked />
          <span class="bp-ui-radio__control" aria-hidden="true"></span>
          <span class="bp-ui-radio__content">
            <span class="bp-ui-radio__header">
              <span class="bp-ui-radio__option-label">Real-time Push</span>
              <span class="bp-ui-radio__tag">Recommended</span>
            </span>
            <span class="bp-ui-radio__sublabel">Get instant notifications.</span>
          </span>
        </label>
        <label class="bp-ui-radio__option">
          <input class="bp-ui-radio__input" type="radio" value="sms" disabled />
          <span class="bp-ui-radio__control" aria-hidden="true"></span>
          <span class="bp-ui-radio__content">
            <span class="bp-ui-radio__header">
              <span class="bp-ui-radio__option-label">SMS Alerts</span>
            </span>
            <span class="bp-ui-radio__sublabel">Critical events only.</span>
          </span>
        </label>
      </div>
      <div class="bp-ui-radio__hint">Choose one option.</div>
      <div class="bp-ui-radio__status" hidden></div>
    </div>
  `;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('BPUIRadioGroup', () => {
  it('auto-initializes eligible roots only once', () => {
    document.body.innerHTML = `
      ${createRadioMarkup('data-value="email"')}
      ${createRadioMarkup('data-value="push"')}
    `;

    const firstPass = initBPUIRadios();
    const secondPass = initBPUIRadios();

    expect(firstPass).toHaveLength(2);
    expect(secondPass).toHaveLength(0);
    expect(firstPass[0].getValue()).toBe('email');
    expect(firstPass[1].getValue()).toBe('push');
  });

  it('lets root data-value override checked markup', () => {
    document.body.innerHTML = createRadioMarkup('data-value="email"');
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);

    expect(group.getValue()).toBe('email');
    expect(root.querySelector('.bp-ui-radio__input[value="email"]').checked).toBe(true);
  });

  it('propagates the root name to child radios when missing', () => {
    document.body.innerHTML = createRadioMarkup('data-name="notification-preference"');
    const root = document.querySelector('.bp-ui-radio');

    new BPUIRadioGroup(root);

    expect(Array.from(root.querySelectorAll('.bp-ui-radio__input')).every((input) => input.name === 'notification-preference')).toBe(true);
  });

  it('syncs selected classes for the default variant', () => {
    document.body.innerHTML = createRadioMarkup();
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);

    group.setValue('email');

    expect(root.querySelector('.bp-ui-radio__option:nth-child(1)').classList.contains('is-selected')).toBe(true);
    expect(root.querySelector('.bp-ui-radio__option:nth-child(2)').classList.contains('is-selected')).toBe(false);
  });

  it('syncs selected classes for the pill variant', () => {
    document.body.innerHTML = createRadioMarkup('data-variant="pill"', 'bp-ui-radio--pill');
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);

    group.setValue('email');

    expect(root.classList.contains('bp-ui-radio--pill')).toBe(true);
    expect(root.querySelector('.bp-ui-radio__option:nth-child(1)').classList.contains('is-selected')).toBe(true);
  });

  it('disables the whole group from the root state while preserving per-option disabled state', () => {
    document.body.innerHTML = createRadioMarkup();
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);

    group.disable();

    expect(Array.from(root.querySelectorAll('.bp-ui-radio__input')).every((input) => input.disabled)).toBe(true);

    group.enable();
    expect(root.querySelector('.bp-ui-radio__input[value="sms"]').disabled).toBe(true);
    expect(root.querySelector('.bp-ui-radio__input[value="email"]').disabled).toBe(false);
  });

  it('dispatches radio change events with the expected detail', () => {
    document.body.innerHTML = createRadioMarkup();
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);
    const events = [];

    root.addEventListener('bp-ui:radio:change', (event) => events.push(event));

    group.setValue('email');

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({
      value: 'email',
      previousValue: 'push',
      trigger: 'api',
    });
  });

  it('respects per-option disabled values', () => {
    document.body.innerHTML = createRadioMarkup();
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);

    group.setValue('sms');
    expect(group.getValue()).toBe('push');
  });

  it('removes listeners on destroy', () => {
    document.body.innerHTML = createRadioMarkup();
    const root = document.querySelector('.bp-ui-radio');
    const group = new BPUIRadioGroup(root);
    const input = root.querySelector('.bp-ui-radio__input[value="email"]');

    group.destroy();
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(group.getValue()).toBe('push');
  });
});
