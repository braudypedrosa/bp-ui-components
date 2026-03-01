import { describe, expect, it } from 'vitest';
import { createRadioState } from '../src/core/radio-state.js';

function createOptions() {
  return [
    { value: 'email', label: 'Email Summary' },
    { value: 'push', label: 'Real-time Push' },
    { value: 'sms', label: 'SMS Alerts', disabled: true },
  ];
}

describe('createRadioState', () => {
  it('normalizes the default config', () => {
    const radio = createRadioState({
      options: createOptions(),
    });

    expect(radio.getState()).toMatchObject({
      value: '',
      size: 'md',
      variant: 'default',
      disabled: false,
      selectedIndex: -1,
    });
  });

  it('rejects invalid options', () => {
    expect(() => createRadioState({
      options: [{ value: 'email' }],
    })).toThrow(/requires a label/i);
  });

  it('normalizes the initial value', () => {
    const radio = createRadioState({
      value: 'unknown',
      options: createOptions(),
    });

    expect(radio.getState().value).toBe('');
  });

  it('accepts only allowed values', () => {
    const radio = createRadioState({
      value: 'email',
      options: createOptions(),
    });

    radio.setValue('push');
    expect(radio.getState().value).toBe('push');

    radio.setValue('unknown');
    expect(radio.getState().value).toBe('push');
  });

  it('blocks mutation while disabled', () => {
    const radio = createRadioState({
      options: createOptions(),
    });

    radio.setDisabled(true);
    radio.setValue('email');

    expect(radio.getState()).toMatchObject({
      disabled: true,
      value: '',
    });
  });

  it('does not allow disabled options to be selected', () => {
    const radio = createRadioState({
      options: createOptions(),
    });

    radio.setValue('sms');
    expect(radio.getState().value).toBe('');
  });
});
