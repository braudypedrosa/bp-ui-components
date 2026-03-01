import { describe, expect, it } from 'vitest';
import { createSelectState } from '../src/core/select-state.js';

function createOptions() {
  return [
    { value: 'villa', label: 'Villa' },
    { value: 'cabin', label: 'Cabin' },
    { value: 'suite', label: 'Suite' },
  ];
}

describe('createSelectState', () => {
  it('normalizes the default config', () => {
    const select = createSelectState({
      options: createOptions(),
    });

    expect(select.getState()).toMatchObject({
      value: '',
      label: '',
      placeholder: 'Select an option',
      size: 'md',
      variant: 'default',
      disabled: false,
      open: false,
      highlightedIndex: -1,
    });
  });

  it('rejects invalid option input', () => {
    expect(() => createSelectState({
      options: 'villa',
    })).toThrow(/options must be an array/i);

    expect(() => createSelectState({
      options: [{ value: 'villa' }],
    })).toThrow(/requires a label/i);
  });

  it('falls back to an empty value when the initial value is invalid', () => {
    const select = createSelectState({
      value: 'castle',
      options: createOptions(),
    });

    expect(select.getState().value).toBe('');
  });

  it('accepts only allowed values', () => {
    const select = createSelectState({
      value: 'villa',
      options: createOptions(),
    });

    select.setValue('cabin');
    expect(select.getState().value).toBe('cabin');

    select.setValue('castle');
    expect(select.getState().value).toBe('cabin');
  });

  it('tracks open, close, and toggle state', () => {
    const select = createSelectState({
      options: createOptions(),
    });

    select.open();
    expect(select.getState().open).toBe(true);

    select.toggle();
    expect(select.getState().open).toBe(false);

    select.toggle();
    expect(select.getState().open).toBe(true);

    select.close();
    expect(select.getState().open).toBe(false);
  });

  it('clamps keyboard highlight movement consistently', () => {
    const select = createSelectState({
      options: createOptions(),
    });

    select.open();
    expect(select.getState().highlightedIndex).toBe(0);

    select.highlightNext();
    select.highlightNext();
    select.highlightNext();

    expect(select.getState().highlightedIndex).toBe(2);

    select.highlightPrevious();
    select.highlightPrevious();
    select.highlightPrevious();

    expect(select.getState().highlightedIndex).toBe(0);

    select.highlightLast();
    expect(select.getState().highlightedIndex).toBe(2);

    select.highlightFirst();
    expect(select.getState().highlightedIndex).toBe(0);
  });

  it('blocks opening and selection while disabled', () => {
    const select = createSelectState({
      options: createOptions(),
    });

    select.setDisabled(true);
    select.open();
    select.setValue('villa');

    expect(select.getState()).toMatchObject({
      disabled: true,
      open: false,
      value: '',
    });
  });
});
