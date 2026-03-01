import { beforeEach, describe, expect, it } from 'vitest';
import { bpUIRadio } from '../src/alpine/radio.js';

function createRadioMarkup(attributes = '') {
  return `
    <div class="bp-ui-radio" data-bp-ui-radio ${attributes}>
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
          </span>
        </label>
      </div>
    </div>
  `;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('bpUIRadio', () => {
  it('returns the expected Alpine-friendly API surface', () => {
    const radio = bpUIRadio();

    expect(radio).toMatchObject({
      value: '',
      disabled: false,
      size: 'md',
      variant: 'default',
    });
    expect(radio.init).toBeTypeOf('function');
    expect(radio.select).toBeTypeOf('function');
    expect(radio.isSelected).toBeTypeOf('function');
  });

  it('infers options from DOM on init and syncs public state', () => {
    document.body.innerHTML = createRadioMarkup('data-value="push" data-variant="pill"');
    const radio = bpUIRadio();

    radio.$el = document.querySelector('.bp-ui-radio');
    radio.init();

    expect(radio.value).toBe('push');
    expect(radio.variant).toBe('pill');
  });

  it('keeps selection helpers in sync', () => {
    document.body.innerHTML = createRadioMarkup();
    const radio = bpUIRadio();

    radio.$el = document.querySelector('.bp-ui-radio');
    radio.init();
    radio.select('email');

    expect(radio.value).toBe('email');
    expect(radio.isSelected('email')).toBe(true);
    expect(radio.isSelected('push')).toBe(false);
  });

  it('supports wrapper-owned Alpine state while reading the inner radio contract', () => {
    document.body.innerHTML = `
      <div data-wrapper>
        ${createRadioMarkup('data-value="push"')}
      </div>
    `;
    const radio = bpUIRadio();

    radio.$el = document.querySelector('[data-wrapper]');
    radio.init();
    radio.select('email');

    expect(radio.value).toBe('email');
    expect(document.querySelector('.bp-ui-radio__input[value="email"]').checked).toBe(true);
    expect(document.querySelector('.bp-ui-radio__input[value="push"]').checked).toBe(false);
    expect(document.querySelector('.bp-ui-radio__option').classList.contains('is-selected')).toBe(true);
  });

  it('syncs public value when the native radio input changes', () => {
    document.body.innerHTML = `
      <div data-wrapper>
        ${createRadioMarkup('data-value="push"')}
      </div>
    `;
    const radio = bpUIRadio();
    const emailInput = document.querySelector('.bp-ui-radio__input[value="email"]');

    radio.$el = document.querySelector('[data-wrapper]');
    radio.init();

    emailInput.checked = true;
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(radio.value).toBe('email');
    expect(radio.isSelected('email')).toBe(true);
  });
});
