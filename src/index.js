import { BPUICounter, initBPUICounters } from './components/counter.js';
import { createCounterState } from './core/counter-state.js';
import { bpUICounter } from './alpine/counter.js';

export {
  BPUICounter,
  initBPUICounters,
  createCounterState,
  bpUICounter,
};

if (typeof window !== 'undefined') {
  window.BPUICounter = BPUICounter;
  window.BP_UI_Counter = BPUICounter;
  window.initBPUICounters = initBPUICounters;
  window.bpUICounter = bpUICounter;
}
