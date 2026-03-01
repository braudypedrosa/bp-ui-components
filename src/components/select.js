import { createSelectState } from '../core/select-state.js';
import { collectSelectOptions, parseBooleanAttribute } from '../core/choice-options.js';

const ROOT_SELECTOR = '[data-bp-ui-select]';
const INSTANCE_KEY = '__bpUiSelectInstance';
const VIEWPORT_GAP = 8;
const VIEWPORT_PADDING = 16;

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

function getRequiredElement(root, selector) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required select element: ${selector}`);
  }

  return element;
}

function dispatchSelectEvent(element, eventName, detail) {
  element.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    detail,
  }));
}

function buildOptionMaps(optionElements) {
  return optionElements.map((element, index) => ({
    element,
    value: element.getAttribute('data-value') || '',
    index,
  }));
}

function parseDataOptions(root, input) {
  const rootValue = root.hasAttribute('data-value') ? root.dataset.value : undefined;

  return {
    value: rootValue ?? input.value,
    placeholder: root.dataset.placeholder,
    name: root.dataset.name,
    size: root.dataset.size,
    variant: root.dataset.variant,
    disabled: parseBooleanAttribute(root, 'data-disabled'),
  };
}

export class BPUISelect {
  constructor(element, options = {}) {
    this.root = typeof element === 'string' ? document.querySelector(element) : element;

    if (!this.root) {
      throw new Error('Select root element not found');
    }

    if (this.root[INSTANCE_KEY]) {
      return this.root[INSTANCE_KEY];
    }

    const trigger = getRequiredElement(this.root, '.bp-ui-select__trigger');
    const input = getRequiredElement(this.root, '.bp-ui-select__input');
    const popover = getRequiredElement(this.root, '.bp-ui-select__popover');
    const optionElements = Array.from(popover.querySelectorAll('.bp-ui-select__option'));

    this.elements = {
      trigger,
      triggerValue: getRequiredElement(this.root, '.bp-ui-select__trigger-value'),
      input,
      popover,
      optionElements,
      label: this.root.querySelector('.bp-ui-select__label'),
      hint: this.root.querySelector('.bp-ui-select__hint'),
      status: this.root.querySelector('.bp-ui-select__status'),
    };
    this.optionElements = buildOptionMaps(optionElements);
    this.popoverParent = this.elements.popover.parentNode;
    this.popoverNextSibling = this.elements.popover.nextSibling;
    this.isPopoverPortaled = false;
    this.options = mergeOptions(parseDataOptions(this.root, input), options);
    this.state = createSelectState({
      ...this.options,
      options: collectSelectOptions(this.root),
    });

    this.boundHandleTriggerClick = this.handleTriggerClick.bind(this);
    this.boundHandleTriggerKeydown = this.handleTriggerKeydown.bind(this);
    this.boundHandlePopoverKeydown = this.handlePopoverKeydown.bind(this);
    this.boundHandlePopoverClick = this.handlePopoverClick.bind(this);
    this.boundHandlePopoverPointerMove = this.handlePopoverPointerMove.bind(this);
    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.boundHandleViewportChange = this.positionPopover.bind(this);

    this.elements.popover.hidden = true;
    this.elements.popover.tabIndex = -1;
    this.syncInputName();
    this.attachEvents();
    this.render();
    this.root[INSTANCE_KEY] = this;
  }

  attachEvents() {
    this.elements.trigger.addEventListener('click', this.boundHandleTriggerClick);
    this.elements.trigger.addEventListener('keydown', this.boundHandleTriggerKeydown);
    this.elements.popover.addEventListener('keydown', this.boundHandlePopoverKeydown);
    this.elements.popover.addEventListener('click', this.boundHandlePopoverClick);
    this.elements.popover.addEventListener('pointermove', this.boundHandlePopoverPointerMove);
    document.addEventListener('click', this.boundHandleDocumentClick);
    document.addEventListener('keydown', this.boundHandleDocumentKeydown);
  }

  detachEvents() {
    this.elements.trigger.removeEventListener('click', this.boundHandleTriggerClick);
    this.elements.trigger.removeEventListener('keydown', this.boundHandleTriggerKeydown);
    this.elements.popover.removeEventListener('keydown', this.boundHandlePopoverKeydown);
    this.elements.popover.removeEventListener('click', this.boundHandlePopoverClick);
    this.elements.popover.removeEventListener('pointermove', this.boundHandlePopoverPointerMove);
    document.removeEventListener('click', this.boundHandleDocumentClick);
    document.removeEventListener('keydown', this.boundHandleDocumentKeydown);
    this.removeViewportListeners();
  }

  addViewportListeners() {
    window.addEventListener('resize', this.boundHandleViewportChange);
    window.addEventListener('scroll', this.boundHandleViewportChange, true);
  }

  removeViewportListeners() {
    window.removeEventListener('resize', this.boundHandleViewportChange);
    window.removeEventListener('scroll', this.boundHandleViewportChange, true);
  }

  syncInputName() {
    const inputName = this.options.name || this.elements.input.getAttribute('name');

    if (inputName) {
      this.elements.input.name = inputName;
    }
  }

  ensureAccessibleRoot() {
    const hasVisibleLabel = Boolean(this.elements.label && this.elements.label.textContent.trim());

    if (!hasVisibleLabel && !this.root.getAttribute('aria-label')) {
      this.root.setAttribute('aria-label', 'Select');
    }
  }

  render() {
    const snapshot = this.state.getState();

    this.ensureAccessibleRoot();
    this.syncPresentationClasses(snapshot);
    this.root.classList.toggle('is-open', snapshot.open);
    this.root.classList.toggle('is-disabled', snapshot.disabled);
    this.root.setAttribute('aria-disabled', snapshot.disabled ? 'true' : 'false');

    this.elements.trigger.disabled = snapshot.disabled;
    this.elements.trigger.setAttribute('aria-expanded', snapshot.open ? 'true' : 'false');
    this.elements.triggerValue.textContent = snapshot.label || snapshot.placeholder;
    this.elements.input.value = snapshot.value;
    this.elements.input.disabled = snapshot.disabled;
    this.elements.popover.hidden = !snapshot.open;
    this.elements.popover.setAttribute('aria-hidden', snapshot.open ? 'false' : 'true');

    this.optionElements.forEach(({ element, value, index }) => {
      const isSelected = snapshot.value === value;
      const isHighlighted = snapshot.highlightedIndex === index;

      element.classList.toggle('is-selected', isSelected);
      element.classList.toggle('is-highlighted', isHighlighted);
      element.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    if (snapshot.open) {
      this.positionPopover();
    } else {
      this.clearPopoverPosition();
    }
  }

  syncPresentationClasses(snapshot) {
    const classStates = [
      ['bp-ui-select--sm', snapshot.size === 'sm'],
      ['bp-ui-select--md', snapshot.size === 'md'],
      ['bp-ui-select--lg', snapshot.size === 'lg'],
      ['bp-ui-select--default', snapshot.variant === 'default'],
      ['bp-ui-select--outline', snapshot.variant === 'outline'],
      ['bp-ui-select--soft', snapshot.variant === 'soft'],
    ];

    classStates.forEach(([className, enabled]) => {
      this.root.classList.toggle(className, enabled);
      this.elements.popover.classList.toggle(className, enabled);
    });
  }

  clearPopoverPosition() {
    this.root.classList.remove('bp-ui-select--above');
    this.elements.popover.style.top = '';
    this.elements.popover.style.left = '';
    this.elements.popover.style.minWidth = '';
    this.elements.popover.style.maxHeight = '';
    this.elements.popover.style.visibility = '';
  }

  mountPopoverToBody() {
    if (this.isPopoverPortaled || !document.body) {
      return;
    }

    document.body.appendChild(this.elements.popover);
    this.isPopoverPortaled = true;
  }

  restorePopover() {
    if (!this.isPopoverPortaled || !this.popoverParent) {
      return;
    }

    this.popoverParent.insertBefore(this.elements.popover, this.popoverNextSibling);
    this.isPopoverPortaled = false;
  }

  positionPopover() {
    const snapshot = this.state.getState();

    if (!snapshot.open) {
      return;
    }

    const viewport = window.visualViewport;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const minLeft = viewportLeft + VIEWPORT_PADDING;
    const minTop = viewportTop + VIEWPORT_PADDING;
    const maxRight = viewportLeft + viewportWidth - VIEWPORT_PADDING;
    const maxBottom = viewportTop + viewportHeight - VIEWPORT_PADDING;
    const triggerRect = this.elements.trigger.getBoundingClientRect();

    this.elements.popover.style.visibility = 'hidden';
    this.elements.popover.style.top = '0px';
    this.elements.popover.style.left = '0px';
    this.elements.popover.style.minWidth = `${Math.round(triggerRect.width)}px`;
    this.elements.popover.style.maxHeight = '';

    const initialRect = this.elements.popover.getBoundingClientRect();
    const availableBelow = Math.max(0, maxBottom - triggerRect.bottom - VIEWPORT_GAP);
    const availableAbove = Math.max(0, triggerRect.top - minTop - VIEWPORT_GAP);
    const shouldOpenAbove = initialRect.height > availableBelow && availableAbove > availableBelow;
    const availableSpace = shouldOpenAbove ? availableAbove : availableBelow;

    if (availableSpace > 0) {
      this.elements.popover.style.maxHeight = `${Math.floor(availableSpace)}px`;
    }

    const popoverRect = this.elements.popover.getBoundingClientRect();
    const clampedLeft = Math.max(
      minLeft,
      Math.min(triggerRect.left, maxRight - popoverRect.width),
    );
    const desiredTop = shouldOpenAbove
      ? triggerRect.top - popoverRect.height - VIEWPORT_GAP
      : triggerRect.bottom + VIEWPORT_GAP;
    const clampedTop = Math.max(
      minTop,
      Math.min(desiredTop, maxBottom - popoverRect.height),
    );

    this.root.classList.toggle('bp-ui-select--above', shouldOpenAbove);
    this.elements.popover.style.left = `${Math.round(clampedLeft)}px`;
    this.elements.popover.style.top = `${Math.round(clampedTop)}px`;
    this.elements.popover.style.visibility = '';
  }

  dispatchChange(previous, current, trigger) {
    dispatchSelectEvent(this.root, 'bp-ui:select:change', {
      value: current.value,
      previousValue: previous.value,
      label: current.label,
      previousLabel: previous.label,
      trigger,
    });
  }

  open() {
    const previous = this.state.getState();
    const current = this.state.open();

    if (previous.open === current.open) {
      return current;
    }

    this.mountPopoverToBody();
    this.render();
    this.addViewportListeners();
    this.elements.popover.focus();
    dispatchSelectEvent(this.root, 'bp-ui:select:open', {
      value: current.value,
      label: current.label,
    });
    return current;
  }

  close({ restoreFocus = false, emit = true } = {}) {
    const previous = this.state.getState();
    const current = this.state.close();

    if (previous.open === current.open) {
      return current;
    }

    this.removeViewportListeners();
    this.render();
    this.restorePopover();

    if (restoreFocus) {
      this.elements.trigger.focus();
    }

    if (emit) {
      dispatchSelectEvent(this.root, 'bp-ui:select:close', {
        value: current.value,
        label: current.label,
      });
    }

    return current;
  }

  toggle() {
    return this.state.getState().open ? this.close() : this.open();
  }

  getValue() {
    return this.state.getState().value;
  }

  setValue(value, trigger = 'api') {
    const previous = this.state.getState();
    const current = this.state.setValue(value);

    this.render();

    if (previous.value !== current.value) {
      this.dispatchChange(previous, current, trigger);
    }

    return current.value;
  }

  selectHighlighted(trigger = 'keyboard') {
    const snapshot = this.state.getState();
    const highlighted = snapshot.options[snapshot.highlightedIndex];

    if (!highlighted) {
      return snapshot.value;
    }

    return this.setValue(highlighted.value, trigger);
  }

  enable() {
    this.state.setDisabled(false);
    this.render();
  }

  disable() {
    const snapshot = this.state.getState();

    this.state.setDisabled(true);
    this.removeViewportListeners();
    this.render();

    if (snapshot.open) {
      dispatchSelectEvent(this.root, 'bp-ui:select:close', {
        value: this.state.getState().value,
        label: this.state.getState().label,
      });
    }
  }

  handleTriggerClick() {
    this.toggle();
  }

  handleTriggerKeydown(event) {
    const snapshot = this.state.getState();

    if (snapshot.disabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
      this.state.highlightNext();
      this.render();
      this.elements.popover.focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.open();
      this.state.highlightPrevious();
      this.render();
      this.elements.popover.focus();
    }
  }

  handlePopoverKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close({ restoreFocus: true });
      return;
    }

    if (event.key === 'Tab') {
      this.close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.state.highlightNext();
      this.render();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.state.highlightPrevious();
      this.render();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.state.highlightFirst();
      this.render();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.state.highlightLast();
      this.render();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectHighlighted('keyboard');
      this.close({ restoreFocus: true });
    }
  }

  handlePopoverClick(event) {
    const option = event.target.closest('.bp-ui-select__option');

    if (!option) {
      return;
    }

    const value = option.getAttribute('data-value') || '';

    this.setValue(value, 'option');
    this.close();
  }

  handlePopoverPointerMove(event) {
    const option = event.target.closest('.bp-ui-select__option');

    if (!option) {
      return;
    }

    const optionIndex = this.optionElements.find((entry) => entry.element === option)?.index;

    if (optionIndex == null) {
      return;
    }

    this.state.highlightIndex(optionIndex);
    this.render();
  }

  handleDocumentClick(event) {
    if (!this.state.getState().open) {
      return;
    }

    if (this.root.contains(event.target) || this.elements.popover.contains(event.target)) {
      return;
    }

    this.close();
  }

  handleDocumentKeydown(event) {
    if (event.key !== 'Escape' || !this.state.getState().open) {
      return;
    }

    this.close({ restoreFocus: true });
  }

  destroy() {
    this.close({ emit: false });
    this.detachEvents();
    this.restorePopover();
    delete this.root[INSTANCE_KEY];
  }
}

export function initBPUISelects(root = document) {
  return collectRoots(root)
    .filter((element) => !element[INSTANCE_KEY])
    .map((element) => new BPUISelect(element));
}
