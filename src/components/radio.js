import { createRadioState } from '../core/radio-state.js';
import { collectRadioOptions, parseBooleanAttribute } from '../core/choice-options.js';

const ROOT_SELECTOR = '[data-bp-ui-radio]';
const INSTANCE_KEY = '__bpUiRadioGroupInstance';

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

function dispatchRadioEvent(element, eventName, detail) {
  element.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail,
  }));
}

function parseDataOptions(root) {
  const checkedInput = root.querySelector('.bp-ui-radio__input:checked');

  return {
    value: root.hasAttribute('data-value') ? root.dataset.value : checkedInput?.value,
    name: root.dataset.name,
    size: root.dataset.size,
    variant: root.dataset.variant,
    disabled: parseBooleanAttribute(root, 'data-disabled'),
  };
}

export class BPUIRadioGroup {
  constructor(element, options = {}) {
    this.root = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.root) {
      throw new Error('Radio root element not found');
    }

    if (this.root[INSTANCE_KEY]) {
      return this.root[INSTANCE_KEY];
    }

    this.elements = {
      group: this.root.querySelector('.bp-ui-radio__group'),
      label: this.root.querySelector('.bp-ui-radio__label'),
      hint: this.root.querySelector('.bp-ui-radio__hint'),
      status: this.root.querySelector('.bp-ui-radio__status'),
      optionElements: Array.from(this.root.querySelectorAll('.bp-ui-radio__option')),
      inputs: Array.from(this.root.querySelectorAll('.bp-ui-radio__input')),
    };

    if (this.elements.inputs.length === 0) {
      throw new Error('Radio group requires at least one .bp-ui-radio__input');
    }

    this.options = mergeOptions(parseDataOptions(this.root), options);
    this.state = createRadioState({
      ...this.options,
      options: collectRadioOptions(this.root),
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
      this.elements.group.setAttribute('role', 'radiogroup');

      if (!hasVisibleLabel && !this.elements.group.getAttribute('aria-label')) {
        this.elements.group.setAttribute('aria-label', 'Radio group');
      }
    } else if (!hasVisibleLabel && !this.root.getAttribute('aria-label')) {
      this.root.setAttribute('aria-label', 'Radio group');
    }
  }

  render() {
    const snapshot = this.state.getState();

    this.ensureAccessibleRoot();
    this.root.classList.toggle('bp-ui-radio--sm', snapshot.size === 'sm');
    this.root.classList.toggle('bp-ui-radio--md', snapshot.size === 'md');
    this.root.classList.toggle('bp-ui-radio--lg', snapshot.size === 'lg');
    this.root.classList.toggle('bp-ui-radio--default', snapshot.variant === 'default');
    this.root.classList.toggle('bp-ui-radio--pill', snapshot.variant === 'pill');
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
      const isSelected = snapshot.value === option.value;
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

  getValue() {
    return this.state.getState().value;
  }

  setValue(value, trigger = 'api') {
    const previous = this.state.getState();
    const current = this.state.setValue(value);

    this.render();

    if (previous.value !== current.value) {
      dispatchRadioEvent(this.root, 'bp-ui:radio:change', {
        value: current.value,
        previousValue: previous.value,
        trigger,
      });
    }

    return current.value;
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

    if (!(input instanceof HTMLInputElement) || !input.classList.contains('bp-ui-radio__input')) {
      return;
    }

    if (!input.checked) {
      return;
    }

    this.setValue(input.value, 'input');
  }

  destroy() {
    this.detachEvents();
    delete this.root[INSTANCE_KEY];
  }
}

export function initBPUIRadios(root = document) {
  return collectRoots(root)
    .filter((element) => !element[INSTANCE_KEY])
    .map((element) => new BPUIRadioGroup(element));
}
