import { createCounterState } from '../core/counter-state.js';

const ROOT_SELECTOR = '[data-bp-ui-counter]';
const INSTANCE_KEY = '__bpUiCounterInstance';

function parseBooleanAttribute(element, name) {
  if (!element.hasAttribute(name)) {
    return undefined;
  }

  const rawValue = element.getAttribute(name);

  if (rawValue == null || rawValue === '') {
    return true;
  }

  return ['true', '1', 'yes', 'on'].includes(rawValue.toLowerCase());
}

function parseDataOptions(element) {
  return {
    value: element.dataset.value,
    min: element.dataset.min,
    max: element.dataset.max,
    step: element.dataset.step,
    size: element.dataset.size,
    variant: element.dataset.variant,
    layout: element.dataset.layout,
    snapToStep: parseBooleanAttribute(element, 'data-snap-to-step'),
    disabled: parseBooleanAttribute(element, 'data-disabled'),
    loading: parseBooleanAttribute(element, 'data-loading'),
  };
}

function mergeOptions(baseOptions, overrideOptions) {
  return Object.fromEntries(
    Object.entries({
      ...baseOptions,
      ...overrideOptions,
    }).filter(([, value]) => value !== undefined),
  );
}

function dispatchCounterEvent(element, eventName, detail) {
  element.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail,
  }));
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

function getRequiredElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required counter element: ${selector}`);
  }

  return element;
}

function setNumericAttribute(element, attributeName, value) {
  if (value == null) {
    element.removeAttribute(attributeName);
    return;
  }

  element.setAttribute(attributeName, String(value));
}

export class BPUICounter {
  constructor(element, options = {}) {
    this.root = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.root) {
      throw new Error('Counter root element not found');
    }

    if (this.root[INSTANCE_KEY]) {
      return this.root[INSTANCE_KEY];
    }

    this.root.classList.add('bp-widget-reset');
    this.options = mergeOptions(parseDataOptions(this.root), options);
    this.state = createCounterState(this.options);
    this.elements = {
      decrementButton: getRequiredElement(this.root, '.bp-ui-counter__button--decrement'),
      incrementButton: getRequiredElement(this.root, '.bp-ui-counter__button--increment'),
      input: getRequiredElement(this.root, '.bp-ui-counter__input'),
      label: this.root.querySelector('.bp-ui-counter__label'),
      hint: this.root.querySelector('.bp-ui-counter__hint'),
      status: this.root.querySelector('.bp-ui-counter__status'),
      statusText: this.root.querySelector('.bp-ui-counter__status-text'),
      spinner: this.root.querySelector('.bp-ui-counter__spinner'),
    };

    this.boundHandleDecrementClick = this.handleDecrementClick.bind(this);
    this.boundHandleIncrementClick = this.handleIncrementClick.bind(this);
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandleBlur = this.handleBlur.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);

    this.attachEvents();
    this.render();
    this.root[INSTANCE_KEY] = this;
  }

  attachEvents() {
    this.elements.decrementButton.addEventListener('click', this.boundHandleDecrementClick);
    this.elements.incrementButton.addEventListener('click', this.boundHandleIncrementClick);
    this.elements.input.addEventListener('input', this.boundHandleInput);
    this.elements.input.addEventListener('blur', this.boundHandleBlur);
    this.elements.input.addEventListener('keydown', this.boundHandleKeydown);
  }

  detachEvents() {
    this.elements.decrementButton.removeEventListener('click', this.boundHandleDecrementClick);
    this.elements.incrementButton.removeEventListener('click', this.boundHandleIncrementClick);
    this.elements.input.removeEventListener('input', this.boundHandleInput);
    this.elements.input.removeEventListener('blur', this.boundHandleBlur);
    this.elements.input.removeEventListener('keydown', this.boundHandleKeydown);
  }

  handleDecrementClick() {
    this.applyMutation(this.state.decrement(), 'decrement');
  }

  handleIncrementClick() {
    this.applyMutation(this.state.increment(), 'increment');
  }

  handleInput(event) {
    this.elements.input.value = event.target.value;
  }

  handleBlur() {
    this.commitInput('input');
  }

  handleKeydown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.increment();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.decrement();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitInput('input');
    }
  }

  applyMutation(mutationResult, trigger) {
    this.render();

    if (!mutationResult.changed) {
      return mutationResult.current;
    }

    const detail = {
      value: mutationResult.current.value,
      previousValue: mutationResult.previous.value,
      min: mutationResult.current.min,
      max: mutationResult.current.max,
      step: mutationResult.current.step,
      trigger,
    };

    dispatchCounterEvent(this.root, 'bp-ui:counter:change', detail);

    if (mutationResult.hitMin) {
      dispatchCounterEvent(this.root, 'bp-ui:counter:min', detail);
    }

    if (mutationResult.hitMax) {
      dispatchCounterEvent(this.root, 'bp-ui:counter:max', detail);
    }

    return mutationResult.current;
  }

  ensureAccessibleRoot() {
    const hasVisibleLabel = Boolean(this.elements.label && this.elements.label.textContent.trim());

    if (!hasVisibleLabel) {
      this.root.setAttribute('role', 'group');

      if (!this.root.getAttribute('aria-label')) {
        this.root.setAttribute('aria-label', 'Counter');
      }
    }
  }

  render() {
    const snapshot = this.state.getState();
    const isInteractionDisabled = snapshot.disabled || snapshot.loading;

    this.ensureAccessibleRoot();
    this.root.classList.toggle('bp-ui-counter--sm', snapshot.size === 'sm');
    this.root.classList.toggle('bp-ui-counter--md', snapshot.size === 'md');
    this.root.classList.toggle('bp-ui-counter--lg', snapshot.size === 'lg');
    this.root.classList.toggle('bp-ui-counter--default', snapshot.variant === 'default');
    this.root.classList.toggle('bp-ui-counter--outline', snapshot.variant === 'outline');
    this.root.classList.toggle('bp-ui-counter--soft', snapshot.variant === 'soft');
    this.root.classList.toggle('bp-ui-counter--horizontal', snapshot.layout === 'horizontal');
    this.root.classList.toggle('bp-ui-counter--vertical', snapshot.layout === 'vertical');
    this.root.classList.toggle('is-disabled', snapshot.disabled);
    this.root.classList.toggle('is-loading', snapshot.loading);
    this.root.classList.toggle('is-at-min', snapshot.isAtMin);
    this.root.classList.toggle('is-at-max', snapshot.isAtMax);
    this.root.setAttribute('aria-busy', snapshot.loading ? 'true' : 'false');
    this.root.setAttribute('aria-disabled', isInteractionDisabled ? 'true' : 'false');

    this.elements.input.value = String(snapshot.value);
    this.elements.input.disabled = isInteractionDisabled;
    setNumericAttribute(this.elements.input, 'min', snapshot.min);
    setNumericAttribute(this.elements.input, 'max', snapshot.max);
    setNumericAttribute(this.elements.input, 'step', snapshot.step);

    this.elements.decrementButton.disabled = !snapshot.canDecrement;
    this.elements.incrementButton.disabled = !snapshot.canIncrement;

    if (this.elements.spinner) {
      this.elements.spinner.hidden = !snapshot.loading;
      this.elements.spinner.setAttribute('aria-hidden', snapshot.loading ? 'false' : 'true');
    }

    if (this.elements.status) {
      const hasStaticStatus = this.elements.status.dataset.static !== undefined;
      const loadingLabel = this.elements.status.dataset.loadingLabel || 'Updating';
      const defaultLabel = this.elements.status.dataset.defaultLabel || '';

      if (snapshot.loading) {
        this.elements.status.hidden = false;
        if (this.elements.statusText) {
          this.elements.statusText.textContent = loadingLabel;
        } else if (!this.elements.spinner) {
          this.elements.status.textContent = loadingLabel;
        }
      } else if (!hasStaticStatus) {
        this.elements.status.hidden = true;
        if (this.elements.statusText) {
          this.elements.statusText.textContent = '';
        } else if (!this.elements.spinner) {
          this.elements.status.textContent = '';
        }
      } else {
        this.elements.status.hidden = false;
        if (this.elements.statusText) {
          this.elements.statusText.textContent = defaultLabel;
        } else if (!this.elements.spinner) {
          this.elements.status.textContent = defaultLabel;
        }
      }
    }
  }

  commitInput(trigger = 'input') {
    return this.applyMutation(this.state.setValue(this.elements.input.value), trigger);
  }

  getValue() {
    return this.state.getState().value;
  }

  setValue(value, trigger = 'api') {
    return this.applyMutation(this.state.setValue(value), trigger);
  }

  increment() {
    return this.applyMutation(this.state.increment(), 'increment');
  }

  decrement() {
    return this.applyMutation(this.state.decrement(), 'decrement');
  }

  enable() {
    this.state.setDisabled(false);
    this.render();
  }

  disable() {
    this.state.setDisabled(true);
    this.render();
  }

  setLoading(flag) {
    this.state.setLoading(flag);
    this.render();
  }

  destroy() {
    this.detachEvents();
    delete this.root[INSTANCE_KEY];
  }
}

export function initBPUICounters(root = document) {
  return collectRoots(root)
    .filter((element) => !element[INSTANCE_KEY])
    .map((element) => new BPUICounter(element));
}
