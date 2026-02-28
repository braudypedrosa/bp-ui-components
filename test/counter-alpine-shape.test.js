import { describe, expect, it } from 'vitest';
import { bpUICounter } from '../src/alpine/counter.js';

describe('bpUICounter', () => {
  it('returns the expected Alpine-friendly API surface', () => {
    const counter = bpUICounter();

    expect(counter).toMatchObject({
      value: 0,
      min: null,
      max: null,
      step: 1,
      disabled: false,
      loading: false,
      size: 'md',
      variant: 'default',
      layout: 'horizontal',
    });
    expect(counter.init).toBeTypeOf('function');
    expect(counter.increment).toBeTypeOf('function');
    expect(counter.decrement).toBeTypeOf('function');
    expect(counter.onInput).toBeTypeOf('function');
    expect(counter.commitInput).toBeTypeOf('function');
    expect(counter.canIncrement).toBeTypeOf('function');
    expect(counter.canDecrement).toBeTypeOf('function');
  });

  it('syncs its public properties on init and after increment and decrement', () => {
    const counter = bpUICounter({
      value: 3,
      min: 1,
      max: 7,
      step: 2,
      variant: 'soft',
    });

    counter.init();
    counter.increment();
    counter.decrement();

    expect(counter.value).toBe(3);
    expect(counter.inputValue).toBe('3');
    expect(counter.variant).toBe('soft');
    expect(counter.canIncrement()).toBe(true);
    expect(counter.canDecrement()).toBe(true);
  });

  it('uses the same commit rules as the vanilla controller for direct input', () => {
    const counter = bpUICounter({
      value: 4,
      min: 0,
      max: 6,
    });

    counter.init();
    counter.onInput({ target: { value: '99' } });
    counter.commitInput({ target: { value: '99' } });

    expect(counter.value).toBe(6);
    expect(counter.inputValue).toBe('6');

    counter.onInput({ target: { value: 'abc' } });
    counter.commitInput({ target: { value: 'abc' } });

    expect(counter.value).toBe(6);
    expect(counter.inputValue).toBe('6');
  });
});
