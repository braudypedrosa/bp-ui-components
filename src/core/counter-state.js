const VALID_SIZES = new Set(['sm', 'md', 'lg']);
const VALID_VARIANTS = new Set(['default', 'outline', 'soft']);
const VALID_LAYOUTS = new Set(['horizontal', 'vertical']);
const EPSILON = 1e-9;

function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeChoice(value, allowedValues, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return allowedValues.has(normalized) ? normalized : fallback;
}

function normalizeStep(value) {
  const parsed = parseNumber(value);

  if (parsed == null || parsed <= 0) {
    return 1;
  }

  return parsed;
}

function clampValue(value, min, max) {
  let nextValue = value;

  if (min != null && nextValue < min) {
    nextValue = min;
  }

  if (max != null && nextValue > max) {
    nextValue = max;
  }

  return nextValue;
}

function countDecimalPlaces(value) {
  const valueString = String(value);

  if (valueString.includes('e-')) {
    const [base, exponent] = valueString.split('e-');
    const decimalPlaces = (base.split('.')[1] || '').length;
    return decimalPlaces + Number(exponent);
  }

  return (valueString.split('.')[1] || '').length;
}

function roundWithPrecision(value, precision) {
  return Number(value.toFixed(Math.min(precision, 10)));
}

function roundCommittedValue(value) {
  return Number.parseFloat(value.toFixed(6));
}

function stepValue(value, step, direction) {
  const precision = Math.max(countDecimalPlaces(value), countDecimalPlaces(step));
  return roundWithPrecision(value + (step * direction), precision);
}

function isWithinEpsilon(left, right) {
  return Math.abs(left - right) <= EPSILON;
}

function deriveState(state) {
  const isAtMin = state.min != null && (state.value < state.min || isWithinEpsilon(state.value, state.min));
  const isAtMax = state.max != null && (state.value > state.max || isWithinEpsilon(state.value, state.max));
  const interactionsBlocked = state.disabled || state.loading;

  return {
    ...state,
    isAtMin,
    isAtMax,
    canIncrement: !interactionsBlocked && !isAtMax,
    canDecrement: !interactionsBlocked && !isAtMin,
  };
}

function normalizeValue(value, min, max, step, snapToStep) {
  const boundedValue = clampValue(value, min, max);

  if (!snapToStep || min == null) {
    return roundCommittedValue(boundedValue);
  }

  const stepsFromMin = (boundedValue - min) / step;
  const snappedValue = min + (Math.round(stepsFromMin) * step);

  return roundCommittedValue(clampValue(snappedValue, min, max));
}

function normalizeConfig(config = {}) {
  const min = parseNumber(config.min);
  const max = parseNumber(config.max);

  if (min != null && max != null && min > max) {
    throw new Error('min cannot be greater than max');
  }

  const step = normalizeStep(config.step);
  const initialValue = parseNumber(config.value) ?? 0;
  const snapToStep = config.snapToStep === true;

  return {
    value: normalizeValue(initialValue, min, max, step, snapToStep),
    min,
    max,
    step,
    snapToStep,
    disabled: config.disabled === true,
    loading: config.loading === true,
    size: normalizeChoice(config.size, VALID_SIZES, 'md'),
    variant: normalizeChoice(config.variant, VALID_VARIANTS, 'default'),
    layout: normalizeChoice(config.layout, VALID_LAYOUTS, 'horizontal'),
  };
}

function createMutationResult(previous, current) {
  return {
    previous,
    current,
    changed: !isWithinEpsilon(previous.value, current.value),
    hitMin: !previous.isAtMin && current.isAtMin,
    hitMax: !previous.isAtMax && current.isAtMax,
  };
}

export function createCounterState(config = {}) {
  let state = normalizeConfig(config);

  function getState() {
    return deriveState(state);
  }

  function setValue(nextValue) {
    const previous = getState();

    if (previous.disabled || previous.loading) {
      return createMutationResult(previous, previous);
    }

    const parsedValue = parseNumber(nextValue);
    const committedValue = parsedValue == null
      ? previous.value
      : normalizeValue(parsedValue, previous.min, previous.max, previous.step, previous.snapToStep);

    state = {
      ...state,
      value: committedValue,
    };

    return createMutationResult(previous, getState());
  }

  function increment() {
    const snapshot = getState();

    if (!snapshot.canIncrement) {
      return createMutationResult(snapshot, snapshot);
    }

    return setValue(stepValue(snapshot.value, snapshot.step, 1));
  }

  function decrement() {
    const snapshot = getState();

    if (!snapshot.canDecrement) {
      return createMutationResult(snapshot, snapshot);
    }

    return setValue(stepValue(snapshot.value, snapshot.step, -1));
  }

  function setDisabled(flag) {
    state = {
      ...state,
      disabled: Boolean(flag),
    };

    return getState();
  }

  function setLoading(flag) {
    state = {
      ...state,
      loading: Boolean(flag),
    };

    return getState();
  }

  return {
    getState,
    setValue,
    increment,
    decrement,
    setDisabled,
    setLoading,
  };
}
