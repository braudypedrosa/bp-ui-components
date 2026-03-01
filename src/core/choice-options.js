export const VALID_SIZES = new Set(['sm', 'md', 'lg']);
export const SELECT_VARIANTS = new Set(['default', 'outline', 'soft']);
export const RADIO_VARIANTS = new Set(['default', 'pill']);
export const CHECKBOX_VARIANTS = new Set(['default', 'pill']);

function normalizeNonEmptyString(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export function parseBooleanAttribute(element, name) {
  if (!element?.hasAttribute?.(name)) {
    return undefined;
  }

  const rawValue = element.getAttribute(name);

  if (rawValue == null || rawValue === '') {
    return true;
  }

  return ['true', '1', 'yes', 'on'].includes(rawValue.toLowerCase());
}

export function normalizeChoice(value, allowedValues, fallback) {
  const normalized = normalizeNonEmptyString(value);
  return allowedValues.has(normalized) ? normalized : fallback;
}

function normalizeBaseOption(option, index, kindLabel) {
  if (!option || typeof option !== 'object') {
    throw new Error(`${kindLabel} option at index ${index} must be an object`);
  }

  const value = option.value != null ? String(option.value).trim() : '';
  const label = option.label != null ? String(option.label).trim() : '';

  if (!value) {
    throw new Error(`${kindLabel} option at index ${index} requires a value`);
  }

  if (!label) {
    throw new Error(`${kindLabel} option at index ${index} requires a label`);
  }

  return {
    value,
    label,
  };
}

export function normalizeSelectOptions(options = []) {
  if (!Array.isArray(options)) {
    throw new Error('Select options must be an array');
  }

  const seenValues = new Set();

  return options.map((option, index) => {
    const normalized = normalizeBaseOption(option, index, 'Select');

    if (seenValues.has(normalized.value)) {
      throw new Error(`Duplicate select option value: ${normalized.value}`);
    }

    seenValues.add(normalized.value);
    return normalized;
  });
}

export function normalizeRadioOptions(options = []) {
  if (!Array.isArray(options)) {
    throw new Error('Radio options must be an array');
  }

  const seenValues = new Set();

  return options.map((option, index) => {
    const normalized = normalizeBaseOption(option, index, 'Radio');

    if (seenValues.has(normalized.value)) {
      throw new Error(`Duplicate radio option value: ${normalized.value}`);
    }

    seenValues.add(normalized.value);

    return {
      ...normalized,
      description: option.description != null ? String(option.description).trim() : '',
      tag: option.tag != null ? String(option.tag).trim() : '',
      disabled: option.disabled === true,
    };
  });
}

export function normalizeCheckboxOptions(options = []) {
  if (!Array.isArray(options)) {
    throw new Error('Checkbox options must be an array');
  }

  const seenValues = new Set();

  return options.map((option, index) => {
    const normalized = normalizeBaseOption(option, index, 'Checkbox');

    if (seenValues.has(normalized.value)) {
      throw new Error(`Duplicate checkbox option value: ${normalized.value}`);
    }

    seenValues.add(normalized.value);

    return {
      ...normalized,
      description: option.description != null ? String(option.description).trim() : '',
      tag: option.tag != null ? String(option.tag).trim() : '',
      disabled: option.disabled === true,
    };
  });
}

export function findOptionByValue(options, value) {
  return options.find((option) => option.value === value) || null;
}

export function getOptionLabel(options, value) {
  return findOptionByValue(options, value)?.label || '';
}

export function collectSelectOptions(root) {
  return Array.from(root.querySelectorAll('.bp-ui-select__option')).map((optionElement, index) => {
    const value = normalizeNonEmptyString(optionElement.getAttribute('data-value'));
    const labelElement = optionElement.querySelector('.bp-ui-select__option-label');
    const label = normalizeNonEmptyString(labelElement?.textContent || optionElement.textContent);

    if (!value) {
      throw new Error(`Missing required select option value at index ${index}`);
    }

    if (!label) {
      throw new Error(`Missing required select option label at index ${index}`);
    }

    return {
      value,
      label,
    };
  });
}

export function collectRadioOptions(root) {
  return Array.from(root.querySelectorAll('.bp-ui-radio__option')).map((optionElement, index) => {
    const input = optionElement.querySelector('.bp-ui-radio__input');

    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`Missing required radio input at index ${index}`);
    }

    const labelElement = optionElement.querySelector('.bp-ui-radio__option-label');
    const descriptionElement = optionElement.querySelector('.bp-ui-radio__sublabel');
    const tagElement = optionElement.querySelector('.bp-ui-radio__tag');
    const value = normalizeNonEmptyString(input.value || optionElement.getAttribute('data-value'));
    const label = normalizeNonEmptyString(labelElement?.textContent || input.value);

    if (!value) {
      throw new Error(`Missing required radio option value at index ${index}`);
    }

    if (!label) {
      throw new Error(`Missing required radio option label at index ${index}`);
    }

    return {
      value,
      label,
      description: normalizeNonEmptyString(descriptionElement?.textContent),
      tag: normalizeNonEmptyString(tagElement?.textContent),
      disabled: input.disabled,
    };
  });
}

export function collectCheckboxOptions(root) {
  return Array.from(root.querySelectorAll('.bp-ui-checkbox__option')).map((optionElement, index) => {
    const input = optionElement.querySelector('.bp-ui-checkbox__input');

    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`Missing required checkbox input at index ${index}`);
    }

    const labelElement = optionElement.querySelector('.bp-ui-checkbox__option-label');
    const descriptionElement = optionElement.querySelector('.bp-ui-checkbox__sublabel');
    const tagElement = optionElement.querySelector('.bp-ui-checkbox__tag');
    const value = normalizeNonEmptyString(input.value || optionElement.getAttribute('data-value'));
    const label = normalizeNonEmptyString(labelElement?.textContent || input.value);

    if (!value) {
      throw new Error(`Missing required checkbox option value at index ${index}`);
    }

    if (!label) {
      throw new Error(`Missing required checkbox option label at index ${index}`);
    }

    return {
      value,
      label,
      description: normalizeNonEmptyString(descriptionElement?.textContent),
      tag: normalizeNonEmptyString(tagElement?.textContent),
      disabled: input.disabled,
    };
  });
}
