import { createCheckboxState } from '../core/checkbox-state.js';
import { collectCheckboxOptions, parseBooleanAttribute } from '../core/choice-options.js';

const ROOT_SELECTOR = '[data-bp-ui-checkbox]';
const INSTANCE_KEY = '__bpUiCheckboxGroupInstance';

function mergeOptions(baseOptions, overrideOptions) {
  return Object.fromEntries(
    Object.entries({
      ...baseOptions,
      ...overrideOptions,
    }).filter(([, value]) => value !== undefined),
  );
}

function collectRoots(root) {
  if (!root) {
    return [];
  }

  if (root instanceof Element) {
    return root.matches(ROOT_SELECTOR)
      ? [root, ...root.querySelectorAll(ROOT_SELECTOR)]
      : [...root.querySelectorAll(ROOT_SELECTOR)];
  }

  return [...root.querySelectorAll(ROOT_SELECTOR)];
}

function dispatchCheckboxEvent(element, eventName, detail) {
  element.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail,
  }));
}

function parseValuesAttribute(root) {
  if (!root.hasAttribute('data-values')) {
    return undefined;
  }

  return (root.dataset.values || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseDataOptions(root) {
  const checkedInputs = Array.from(root.querySelectorAll('.bp-ui-checkbox__input:checked'));

  return {
    values: parseValuesAttribute(root) ?? checkedInputs.map((input) => input.value),
    name: root.dataset.name,
    size: root.dataset.size,
    variant: root.dataset.variant,
    disabled: parseBooleanAttribute(root, 'data-disabled'),
  };
}

export class BPUICheckboxGroup {
  constructor(element, options = {}) {
    this.root = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.root) {
      throw new Error('Checkbox root element not found');
    }

    if (this.root[INSTANCE_KEY]) {
      return this.root[INSTANCE_KEY];
    }

    this.root.classList.add('bp-widget-reset');
    this.elements = {
      group: this.root.querySelector('.bp-ui-checkbox__group'),
      label: this.root.querySelector('.bp-ui-checkbox__label'),
      hint: this.root.querySelector('.bp-ui-checkbox__hint'),
      status: this.root.querySelector('.bp-ui-checkbox__status'),
      optionElements: Array.from(this.root.querySelectorAll('.bp-ui-checkbox__option')),
      inputs: Array.from(this.root.querySelectorAll('.bp-ui-checkbox__input')),
    };

    if (this.elements.inputs.length === 0) {
      throw new Error('Checkbox group requires at least one .bp-ui-checkbox__input');
    }

    this.options = mergeOptions(parseDataOptions(this.root), options);
    this.state = createCheckboxState({
      ...this.options,
      options: collectCheckboxOptions(this.root),
    });

    this.boundHandleChange = this.handleChange.bind(this);

    this.attachEvents();
    this.render();
    this.root[INSTANCE_KEY] = this;
  }

  attachEvents() {
    this.root.addEventListener('change', this.boundHandleChange);
  }

  detachEvents() {
    this.root.removeEventListener('change', this.boundHandleChange);
  }

  ensureAccessibleRoot() {
    const hasVisibleLabel = Boolean(this.elements.label && this.elements.label.textContent.trim());

    if (this.elements.group) {
      this.elements.group.setAttribute('role', 'group');

      if (!hasVisibleLabel && !this.elements.group.getAttribute('aria-label')) {
        this.elements.group.setAttribute('aria-label', 'Checkbox group');
      }
    } else if (!hasVisibleLabel && !this.root.getAttribute('aria-label')) {
      this.root.setAttribute('aria-label', 'Checkbox group');
    }
  }

  render() {
    const snapshot = this.state.getState();

    this.ensureAccessibleRoot();
    this.root.classList.toggle('bp-ui-checkbox--sm', snapshot.size === 'sm');
    this.root.classList.toggle('bp-ui-checkbox--md', snapshot.size === 'md');
    this.root.classList.toggle('bp-ui-checkbox--lg', snapshot.size === 'lg');
    this.root.classList.toggle('bp-ui-checkbox--default', snapshot.variant === 'default');
    this.root.classList.toggle('bp-ui-checkbox--pill', snapshot.variant === 'pill');
    this.root.classList.toggle('is-disabled', snapshot.disabled);
    this.root.setAttribute('aria-disabled', snapshot.disabled ? 'true' : 'false');

    if (this.options.name) {
      this.elements.inputs.forEach((input) => {
        if (!input.name || input.dataset.bpUiManagedName === 'true') {
          input.name = this.options.name;
          input.dataset.bpUiManagedName = 'true';
        }
      });
    }

    snapshot.options.forEach((option, index) => {
      const optionElement = this.elements.optionElements[index];
      const input = this.elements.inputs[index];
      const isSelected = snapshot.values.includes(option.value);
      const isDisabled = snapshot.disabled || option.disabled;

      if (!optionElement || !input) {
        return;
      }

      optionElement.classList.toggle('is-selected', isSelected);
      optionElement.classList.toggle('is-disabled', isDisabled);
      input.checked = isSelected;
      input.disabled = isDisabled;
    });
  }

  getValues() {
    return [...this.state.getState().values];
  }

  setValues(values, trigger = 'api') {
    const previous = this.state.getState();
    const current = this.state.setValues(values);

    this.render();

    if (JSON.stringify(previous.values) !== JSON.stringify(current.values)) {
      dispatchCheckboxEvent(this.root, 'bp-ui:checkbox:change', {
        values: [...current.values],
        previousValues: [...previous.values],
        trigger,
      });
    }

    return [...current.values];
  }

  toggleValue(value, trigger = 'api') {
    const previous = this.state.getState();
    const current = this.state.toggleValue(value);

    this.render();

    if (JSON.stringify(previous.values) !== JSON.stringify(current.values)) {
      dispatchCheckboxEvent(this.root, 'bp-ui:checkbox:change', {
        values: [...current.values],
        previousValues: [...previous.values],
        value,
        checked: current.values.includes(value),
        trigger,
      });
    }

    return [...current.values];
  }

  clear(trigger = 'api') {
    const previous = this.state.getState();
    const current = this.state.clear();

    this.render();

    if (JSON.stringify(previous.values) !== JSON.stringify(current.values)) {
      dispatchCheckboxEvent(this.root, 'bp-ui:checkbox:change', {
        values: [...current.values],
        previousValues: [...previous.values],
        trigger,
      });
    }

    return [...current.values];
  }

  enable() {
    this.state.setDisabled(false);
    this.render();
  }

  disable() {
    this.state.setDisabled(true);
    this.render();
  }

  handleChange(event) {
    const input = event.target;

    if (!(input instanceof HTMLInputElement) || !input.classList.contains('bp-ui-checkbox__input')) {
      return;
    }

    const previous = this.state.getState();
    const current = this.state.setChecked(input.value, input.checked);

    this.render();

    if (JSON.stringify(previous.values) !== JSON.stringify(current.values)) {
      dispatchCheckboxEvent(this.root, 'bp-ui:checkbox:change', {
        values: [...current.values],
        previousValues: [...previous.values],
        value: input.value,
        checked: current.values.includes(input.value),
        trigger: 'input',
      });
    }
  }

  destroy() {
    this.detachEvents();
    delete this.root[INSTANCE_KEY];
  }
}

export function initBPUICheckboxes(root = document) {
  return collectRoots(root)
    .filter((element) => !element[INSTANCE_KEY])
    .map((element) => new BPUICheckboxGroup(element));
}
