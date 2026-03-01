import { describe, expect, it } from 'vitest';
import { createCheckboxState } from '../src/core/checkbox-state.js';

function createOptions() {
  return [
    { value: 'pool', label: 'Pool' },
    { value: 'spa', label: 'Spa' },
    { value: 'gym', label: 'Gym' },
  ];
}

describe('createCheckboxState', () => {
  it('normalizes the default config', () => {
    const checkbox = createCheckboxState({
      options: createOptions(),
    });

    expect(checkbox.getState()).toMatchObject({
      values: [],
      size: 'md',
      variant: 'default',
      disabled: false,
    });
  });

  it('rejects invalid option input', () => {
    expect(() => createCheckboxState({
      options: 'pool',
    })).toThrow(/options must be an array/i);

    expect(() => createCheckboxState({
      options: [{ value: 'pool' }],
    })).toThrow(/requires a label/i);
  });

  it('filters invalid initial values', () => {
    const checkbox = createCheckboxState({
      values: ['pool', 'sauna', 'gym'],
      options: createOptions(),
    });

    expect(checkbox.getState().values).toEqual(['pool', 'gym']);
  });

  it('supports setting and toggling values', () => {
    const checkbox = createCheckboxState({
      values: ['pool'],
      options: createOptions(),
    });

    checkbox.setValues(['spa', 'gym']);
    expect(checkbox.getState().values).toEqual(['spa', 'gym']);

    checkbox.toggleValue('spa');
    expect(checkbox.getState().values).toEqual(['gym']);

    checkbox.toggleValue('pool');
    expect(checkbox.getState().values).toEqual(['gym', 'pool']);
  });

  it('supports explicit checked state and clear', () => {
    const checkbox = createCheckboxState({
      values: ['pool'],
      options: createOptions(),
    });

    checkbox.setChecked('spa', true);
    checkbox.setChecked('pool', false);

    expect(checkbox.getState().values).toEqual(['spa']);

    checkbox.clear();
    expect(checkbox.getState().values).toEqual([]);
  });

  it('blocks mutation while disabled', () => {
    const checkbox = createCheckboxState({
      options: createOptions(),
    });

    checkbox.setDisabled(true);
    checkbox.setValues(['pool']);
    checkbox.toggleValue('spa');

    expect(checkbox.getState()).toMatchObject({
      disabled: true,
      values: [],
    });
  });
});
