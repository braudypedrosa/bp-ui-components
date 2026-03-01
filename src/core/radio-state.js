import {
  VALID_SIZES,
  RADIO_VARIANTS,
  findOptionByValue,
  normalizeChoice,
  normalizeRadioOptions,
} from './choice-options.js';

function normalizeInitialValue(options, value) {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const option = findOptionByValue(options, normalizedValue);

  if (!option || option.disabled) {
    return '';
  }

  return normalizedValue;
}

function normalizeConfig(config = {}) {
  const options = normalizeRadioOptions(config.options || []);

  return {
    value: normalizeInitialValue(options, config.value),
    size: normalizeChoice(config.size, VALID_SIZES, 'md'),
    variant: normalizeChoice(config.variant, RADIO_VARIANTS, 'default'),
    disabled: config.disabled === true,
    options,
  };
}

function deriveState(state) {
  return {
    ...state,
    selectedIndex: state.options.findIndex((option) => option.value === state.value),
  };
}

export function createRadioState(config = {}) {
  let state = normalizeConfig(config);

  function getState() {
    return deriveState(state);
  }

  function setValue(nextValue) {
    const value = typeof nextValue === 'string' ? nextValue.trim() : '';
    const option = findOptionByValue(state.options, value);

    if (state.disabled || !option || option.disabled) {
      return getState();
    }

    state = {
      ...state,
      value,
    };

    return getState();
  }

  function setDisabled(flag) {
    state = {
      ...state,
      disabled: Boolean(flag),
    };

    return getState();
  }

  return {
    getState,
    setValue,
    setDisabled,
  };
}
