import { createCounterState } from '../core/counter-state.js';

function syncAdapterState(adapter, snapshot) {
  adapter.value = snapshot.value;
  adapter.inputValue = String(snapshot.value);
  adapter.min = snapshot.min;
  adapter.max = snapshot.max;
  adapter.step = snapshot.step;
  adapter.disabled = snapshot.disabled;
  adapter.loading = snapshot.loading;
  adapter.size = snapshot.size;
  adapter.variant = snapshot.variant;
  adapter.layout = snapshot.layout;
}

export function bpUICounter(config = {}) {
  let counterState = null;

  return {
    value: 0,
    inputValue: '0',
    min: null,
    max: null,
    step: 1,
    disabled: false,
    loading: false,
    size: 'md',
    variant: 'default',
    layout: 'horizontal',

    init() {
      if (!counterState) {
        counterState = createCounterState(config);
      }

      syncAdapterState(this, counterState.getState());
      return this;
    },

    increment() {
      this.ensureState();
      const mutationResult = counterState.increment();
      syncAdapterState(this, mutationResult.current);
      return this.value;
    },

    decrement() {
      this.ensureState();
      const mutationResult = counterState.decrement();
      syncAdapterState(this, mutationResult.current);
      return this.value;
    },

    onInput(event) {
      this.inputValue = String(event?.target?.value ?? this.inputValue);
    },

    commitInput(event) {
      this.ensureState();
      const nextValue = event?.target?.value ?? this.inputValue;
      const mutationResult = counterState.setValue(nextValue);
      syncAdapterState(this, mutationResult.current);

      if (event?.target) {
        event.target.value = this.inputValue;
      }

      return this.value;
    },

    canIncrement() {
      this.ensureState();
      return counterState.getState().canIncrement;
    },

    canDecrement() {
      this.ensureState();
      return counterState.getState().canDecrement;
    },

    ensureState() {
      if (!counterState) {
        counterState = createCounterState(config);
        syncAdapterState(this, counterState.getState());
      }

      return counterState;
    },
  };
}
