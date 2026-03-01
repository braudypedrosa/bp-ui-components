import {
  VALID_SIZES,
  SELECT_VARIANTS,
  findOptionByValue,
  getOptionLabel,
  normalizeChoice,
  normalizeSelectOptions,
} from './choice-options.js';

function normalizeConfig(config = {}) {
  const options = normalizeSelectOptions(config.options || []);
  const value = typeof config.value === 'string' ? config.value.trim() : '';

  return {
    value: findOptionByValue(options, value) ? value : '',
    placeholder: typeof config.placeholder === 'string' && config.placeholder.trim()
      ? config.placeholder.trim()
      : 'Select an option',
    size: normalizeChoice(config.size, VALID_SIZES, 'md'),
    variant: normalizeChoice(config.variant, SELECT_VARIANTS, 'default'),
    disabled: config.disabled === true,
    open: false,
    highlightedIndex: -1,
    options,
  };
}

function getSelectedIndex(state) {
  return state.options.findIndex((option) => option.value === state.value);
}

function deriveState(state) {
  const selectedIndex = getSelectedIndex(state);
  const highlightedOption = state.options[state.highlightedIndex] || null;

  return {
    ...state,
    selectedIndex,
    label: getOptionLabel(state.options, state.value),
    hasValue: state.value !== '',
    highlightedValue: highlightedOption?.value || '',
  };
}

function clampIndex(index, length) {
  if (length <= 0) {
    return -1;
  }

  return Math.max(0, Math.min(index, length - 1));
}

function getOpenHighlightIndex(state) {
  if (state.options.length === 0) {
    return -1;
  }

  const selectedIndex = getSelectedIndex(state);
  return selectedIndex >= 0 ? selectedIndex : 0;
}

export function createSelectState(config = {}) {
  let state = normalizeConfig(config);

  function getState() {
    return deriveState(state);
  }

  function open() {
    if (state.disabled || state.open) {
      return getState();
    }

    state = {
      ...state,
      open: true,
      highlightedIndex: getOpenHighlightIndex(state),
    };

    return getState();
  }

  function close() {
    if (!state.open) {
      return getState();
    }

    state = {
      ...state,
      open: false,
      highlightedIndex: getSelectedIndex(state),
    };

    return getState();
  }

  function toggle() {
    return state.open ? close() : open();
  }

  function setValue(nextValue) {
    const value = typeof nextValue === 'string' ? nextValue.trim() : '';

    if (state.disabled || !findOptionByValue(state.options, value)) {
      return getState();
    }

    state = {
      ...state,
      value,
      highlightedIndex: state.open ? state.highlightedIndex : getSelectedIndex({
        ...state,
        value,
      }),
    };

    return getState();
  }

  function setDisabled(flag) {
    state = {
      ...state,
      disabled: Boolean(flag),
      open: Boolean(flag) ? false : state.open,
      highlightedIndex: Boolean(flag) ? getSelectedIndex(state) : state.highlightedIndex,
    };

    return getState();
  }

  function highlightIndex(index) {
    if (!state.open) {
      open();
    }

    state = {
      ...state,
      highlightedIndex: clampIndex(index, state.options.length),
    };

    return getState();
  }

  function highlightNext() {
    const current = state.highlightedIndex < 0 ? getOpenHighlightIndex(state) : state.highlightedIndex;
    return highlightIndex(current + 1);
  }

  function highlightPrevious() {
    const current = state.highlightedIndex < 0 ? getOpenHighlightIndex(state) : state.highlightedIndex;
    return highlightIndex(current - 1);
  }

  function highlightFirst() {
    return highlightIndex(0);
  }

  function highlightLast() {
    return highlightIndex(state.options.length - 1);
  }

  return {
    getState,
    open,
    close,
    toggle,
    setValue,
    setDisabled,
    highlightIndex,
    highlightNext,
    highlightPrevious,
    highlightFirst,
    highlightLast,
  };
}
