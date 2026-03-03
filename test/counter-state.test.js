import { describe, expect, it } from 'vitest';
import { createCounterState } from '../src/core/counter-state.js';

describe('createCounterState', () => {
  it('normalizes the default config', () => {
    const counter = createCounterState();

    expect(counter.getState()).toMatchObject({
      value: 0,
      min: null,
      max: null,
      step: 1,
      disabled: false,
      loading: false,
      size: 'md',
      variant: 'default',
      layout: 'horizontal',
      canIncrement: true,
      canDecrement: true,
      isAtMin: false,
      isAtMax: false,
    });
  });

  it('clamps the initial value and later updates into min and max', () => {
    const counter = createCounterState({
      value: 10,
      min: 2,
      max: 6,
    });

    expect(counter.getState().value).toBe(6);

    counter.setValue(-100);
    expect(counter.getState().value).toBe(2);
  });

  it('increments and decrements using the configured step', () => {
    const counter = createCounterState({
      value: 3,
      step: 2,
      max: 10,
    });

    counter.increment();
    counter.increment();
    counter.decrement();

    expect(counter.getState().value).toBe(5);
  });

  it('falls back to the last committed value when direct input is invalid', () => {
    const counter = createCounterState({
      value: 4,
    });

    counter.setValue('abc');

    expect(counter.getState().value).toBe(4);
  });

  it('blocks value mutations while disabled', () => {
    const counter = createCounterState({
      value: 2,
    });

    counter.setDisabled(true);
    counter.increment();
    counter.setValue(9);

    expect(counter.getState().value).toBe(2);
  });

  it('blocks value mutations while loading', () => {
    const counter = createCounterState({
      value: 2,
    });

    counter.setLoading(true);
    counter.decrement();
    counter.setValue(0);

    expect(counter.getState().value).toBe(2);
  });

  it('throws when min is greater than max', () => {
    expect(() => createCounterState({
      min: 8,
      max: 3,
    })).toThrow('min cannot be greater than max');
  });

  it('supports decimal steps without accumulating visible precision errors', () => {
    const counter = createCounterState({
      value: 0.5,
      step: 0.25,
      max: 1.5,
    });

    counter.increment();
    counter.increment();

    expect(counter.getState().value).toBe(1);
  });

  it('snaps direct input to the nearest step from min when snapToStep is enabled', () => {
    const counter = createCounterState({
      min: 1,
      max: 10,
      step: 2,
      snapToStep: true,
    });

    counter.setValue(4.2);
    expect(counter.getState().value).toBe(5);

    counter.setValue(8.6);
    expect(counter.getState().value).toBe(9);
  });

  it('supports decimal snapping when snapToStep is enabled', () => {
    const counter = createCounterState({
      min: 0.5,
      max: 2,
      step: 0.25,
      snapToStep: true,
    });

    counter.setValue(1.37);

    expect(counter.getState().value).toBe(1.25);
  });
});
