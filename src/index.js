import { BPUICounter, initBPUICounters } from './components/counter.js';
import { BPUISelect, initBPUISelects } from './components/select.js';
import { BPUIRadioGroup, initBPUIRadios } from './components/radio.js';
import { BPUICheckboxGroup, initBPUICheckboxes } from './components/checkbox.js';
import { createCounterState } from './core/counter-state.js';
import { createSelectState } from './core/select-state.js';
import { createRadioState } from './core/radio-state.js';
import { createCheckboxState } from './core/checkbox-state.js';
import { bpUICounter } from './alpine/counter.js';
import { bpUISelect } from './alpine/select.js';
import { bpUIRadio } from './alpine/radio.js';
import { bpUICheckbox } from './alpine/checkbox.js';

export {
  BPUICounter,
  initBPUICounters,
  createCounterState,
  bpUICounter,
  BPUISelect,
  initBPUISelects,
  createSelectState,
  bpUISelect,
  BPUIRadioGroup,
  initBPUIRadios,
  createRadioState,
  bpUIRadio,
  BPUICheckboxGroup,
  initBPUICheckboxes,
  createCheckboxState,
  bpUICheckbox,
};

if (typeof window !== 'undefined') {
  window.BPUICounter = BPUICounter;
  window.BP_UI_Counter = BPUICounter;
  window.initBPUICounters = initBPUICounters;
  window.bpUICounter = bpUICounter;
  window.BPUISelect = BPUISelect;
  window.BP_UI_Select = BPUISelect;
  window.initBPUISelects = initBPUISelects;
  window.bpUISelect = bpUISelect;
  window.BPUIRadioGroup = BPUIRadioGroup;
  window.BP_UI_RadioGroup = BPUIRadioGroup;
  window.initBPUIRadios = initBPUIRadios;
  window.bpUIRadio = bpUIRadio;
  window.BPUICheckboxGroup = BPUICheckboxGroup;
  window.BP_UI_CheckboxGroup = BPUICheckboxGroup;
  window.initBPUICheckboxes = initBPUICheckboxes;
  window.bpUICheckbox = bpUICheckbox;
}
