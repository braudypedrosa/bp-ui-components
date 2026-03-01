import {
  CHECKBOX_VARIANTS,
  VALID_SIZES,
  findOptionByValue,
  normalizeCheckboxOptions,
  normalizeChoice,
} from './choice-options.js';

function normalizeValues(options, values) {
  const rawValues = Array.isArray(values)
    ? values
    : (typeof values === 'string' && values.trim()
      ? values.split(',')
      : []);

  const seenValues = new Set();

  return rawValues.reduce((result, value) => {
    const normalizedValue = value != null ? String(value).trim() : '';
    const option = findOptionByValue(options, normalizedValue);

    if (!normalizedValue || seenValues.has(normalizedValue) || !option || option.disabled) {
      return result;
    }

    seenValues.add(normalizedValue);
    result.push(normalizedValue);
    return result;
  }, []);
}

function normalizeConfig(config = {}) {
  const options = normalizeCheckboxOptions(config.options || []);

  return {
    values: normalizeValues(options, config.values ?? config.value),
    size: normalizeChoice(config.size, VALID_SIZES, 'md'),
    variant: normalizeChoice(config.variant, CHECKBOX_VARIANTS, 'default'),
    disabled: config.disabled === true,
    options,
  };
}

function deriveState(state) {
  return {
    ...state,
    selectedValues: [...state.values],
  };
}

export function createCheckboxState(config = {}) {
  let state = normalizeConfig(config);

  function getState() {
    return deriveState(state);
  }

  function setValues(nextValues) {
    if (state.disabled) {
      return getState();
    }

    state = {
      ...state,
      values: normalizeValues(state.options, nextValues),
    };

    return getState();
  }

  function setChecked(nextValue, checked) {
    const value = typeof nextValue === 'string' ? nextValue.trim() : '';
    const option = findOptionByValue(state.options, value);

    if (state.disabled || !option || option.disabled) {
      return getState();
    }

    const nextValues = checked
      ? [...state.values, value]
      : state.values.filter((entry) => entry !== value);

    return setValues(nextValues);
  }

  function toggleValue(nextValue) {
    const value = typeof nextValue === 'string' ? nextValue.trim() : '';
    return setChecked(value, !state.values.includes(value));
  }

  function clear() {
    if (state.disabled) {
      return getState();
    }

    state = {
      ...state,
      values: [],
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
    setValues,
    setChecked,
    toggleValue,
    clear,
    setDisabled,
  };
}
