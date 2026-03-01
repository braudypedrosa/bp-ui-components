import { collectSelectOptions, parseBooleanAttribute } from '../core/choice-options.js';
import { createSelectState } from '../core/select-state.js';

const VIEWPORT_GAP = 8;
const VIEWPORT_PADDING = 16;

function syncAdapterState(adapter, snapshot) {
  adapter.value = snapshot.value;
  adapter.label = snapshot.label;
  adapter.open = snapshot.open;
  adapter.disabled = snapshot.disabled;
  adapter.size = snapshot.size;
  adapter.variant = snapshot.variant;
}

function resolveRoot(adapter) {
  if (!(adapter.$el instanceof Element)) {
    return null;
  }

  if (adapter.$el.matches('.bp-ui-select')) {
    return adapter.$el;
  }

  return adapter.$el.querySelector('.bp-ui-select');
}

function resolveConfig(adapter, config = {}) {
  const root = resolveRoot(adapter);
  const input = root?.querySelector('.bp-ui-select__input');

  return {
    value: config.value !== undefined
      ? config.value
      : (root?.hasAttribute('data-value') ? root.dataset.value : input?.value),
    placeholder: config.placeholder !== undefined ? config.placeholder : root?.dataset.placeholder,
    size: config.size !== undefined ? config.size : root?.dataset.size,
    variant: config.variant !== undefined ? config.variant : root?.dataset.variant,
    disabled: config.disabled !== undefined ? config.disabled : parseBooleanAttribute(root, 'data-disabled'),
    options: config.options || (root ? collectSelectOptions(root) : []),
  };
}

function getRequiredElement(root, selector) {
  const element = root?.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required select element: ${selector}`);
  }

  return element;
}

function syncPresentationClasses(root, popover, snapshot) {
  const classStates = [
    ['bp-ui-select--sm', snapshot.size === 'sm'],
    ['bp-ui-select--md', snapshot.size === 'md'],
    ['bp-ui-select--lg', snapshot.size === 'lg'],
    ['bp-ui-select--default', snapshot.variant === 'default'],
    ['bp-ui-select--outline', snapshot.variant === 'outline'],
    ['bp-ui-select--soft', snapshot.variant === 'soft'],
  ];

  classStates.forEach(([className, enabled]) => {
    root.classList.toggle(className, enabled);
    popover.classList.toggle(className, enabled);
  });
}

function createOptionElements(popover) {
  return Array.from(popover.querySelectorAll('.bp-ui-select__option')).map((element, index) => ({
    element,
    value: element.getAttribute('data-value') || '',
    index,
  }));
}

export function bpUISelect(config = {}) {
  let selectState = null;
  let root = null;
  let trigger = null;
  let triggerValue = null;
  let input = null;
  let popover = null;
  let optionElements = [];
  let popoverParent = null;
  let popoverNextSibling = null;
  let isPopoverPortaled = false;
  let usesLocalPlacement = false;
  let isInitialized = false;

  const handleDocumentClick = (event) => {
    if (!selectState?.getState().open) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (root?.contains(target) || popover?.contains(target)) {
      return;
    }

    adapter.closePopover();
  };

  const handleDocumentKeydown = (event) => {
    if (!selectState?.getState().open) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      adapter.closePopover({ restoreFocus: true });
      return;
    }

    if (event.key === 'Tab') {
      adapter.closePopover();
    }
  };

  const handleViewportChange = () => {
    adapter.positionPopover();
  };

  const handleTriggerKeydown = (event) => {
    const snapshot = adapter.ensureState().getState();

    if (snapshot.disabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      adapter.openPopover();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      adapter.openPopover();
      syncAdapterState(adapter, selectState.highlightNext());
      adapter.render();
      popover.focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      adapter.openPopover();
      syncAdapterState(adapter, selectState.highlightPrevious());
      adapter.render();
      popover.focus();
    }
  };

  const handlePopoverKeydown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        syncAdapterState(adapter, selectState.highlightNext());
        adapter.render();
        break;
      case 'ArrowUp':
        event.preventDefault();
        syncAdapterState(adapter, selectState.highlightPrevious());
        adapter.render();
        break;
      case 'Home':
        event.preventDefault();
        syncAdapterState(adapter, selectState.highlightFirst());
        adapter.render();
        break;
      case 'End':
        event.preventDefault();
        syncAdapterState(adapter, selectState.highlightLast());
        adapter.render();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        adapter.selectHighlighted('keyboard');
        adapter.closePopover({ restoreFocus: true });
        break;
      case 'Escape':
        event.preventDefault();
        adapter.closePopover({ restoreFocus: true });
        break;
      case 'Tab':
        adapter.closePopover();
        break;
      default:
        break;
    }
  };

  const handlePopoverPointerMove = (event) => {
    const option = event.target instanceof Element
      ? event.target.closest('.bp-ui-select__option')
      : null;

    if (!option) {
      return;
    }

    const index = optionElements.find((entry) => entry.element === option)?.index ?? -1;
    if (index < 0 || selectState.getState().highlightedIndex === index) {
      return;
    }

    syncAdapterState(adapter, selectState.highlightIndex(index));
    adapter.render();
  };

  function addOpenListeners() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);

    if (!usesLocalPlacement) {
      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);
    }
  }

  function removeOpenListeners() {
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleDocumentKeydown);
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('scroll', handleViewportChange, true);
  }

  function clearPopoverPosition() {
    root?.classList.remove('bp-ui-select--above');

    if (!popover) {
      return;
    }

    popover.style.top = '';
    popover.style.left = '';
    popover.style.minWidth = '';
    popover.style.maxHeight = '';
    popover.style.visibility = '';
  }

  function mountPopoverToBody() {
    if (usesLocalPlacement || isPopoverPortaled || !popover || !document.body) {
      return;
    }

    document.body.appendChild(popover);
    isPopoverPortaled = true;
  }

  function restorePopover() {
    if (!isPopoverPortaled || !popoverParent || !popover) {
      return;
    }

    popoverParent.insertBefore(popover, popoverNextSibling);
    isPopoverPortaled = false;
  }

  const adapter = {
    value: '',
    label: '',
    open: false,
    disabled: false,
    size: 'md',
    variant: 'default',

    init() {
      if (!selectState) {
        selectState = createSelectState(resolveConfig(this, config));
      }

      if (!isInitialized) {
        root = resolveRoot(this);

        if (!root) {
          throw new Error('Select root element not found');
        }

        trigger = getRequiredElement(root, '.bp-ui-select__trigger');
        triggerValue = getRequiredElement(root, '.bp-ui-select__trigger-value');
        input = getRequiredElement(root, '.bp-ui-select__input');
        popover = getRequiredElement(root, '.bp-ui-select__popover');
        popoverParent = popover.parentNode;
        popoverNextSibling = popover.nextSibling;
        popover.tabIndex = -1;
        usesLocalPlacement = popover.classList.contains('bp-ui-select__popover--local');
        optionElements = createOptionElements(popover);

        trigger.addEventListener('keydown', handleTriggerKeydown);
        popover.addEventListener('keydown', handlePopoverKeydown);
        popover.addEventListener('pointermove', handlePopoverPointerMove);
        isInitialized = true;
      }

      syncAdapterState(this, selectState.getState());
      this.render();
      return this;
    },

    render() {
      if (!root || !popover || !trigger || !triggerValue || !input) {
        return this;
      }

      const snapshot = this.ensureState().getState();

      syncPresentationClasses(root, popover, snapshot);
      root.classList.toggle('is-open', snapshot.open);
      root.classList.toggle('is-disabled', snapshot.disabled);
      root.setAttribute('aria-disabled', snapshot.disabled ? 'true' : 'false');

      trigger.disabled = snapshot.disabled;
      trigger.setAttribute('aria-expanded', snapshot.open ? 'true' : 'false');
      triggerValue.textContent = snapshot.label || snapshot.placeholder;
      input.value = snapshot.value;
      input.disabled = snapshot.disabled;
      popover.hidden = !snapshot.open;
      popover.setAttribute('aria-hidden', snapshot.open ? 'false' : 'true');

      optionElements.forEach(({ element, value, index }) => {
        const isSelected = snapshot.value === value;
        const isHighlighted = snapshot.highlightedIndex === index;

        element.classList.toggle('is-selected', isSelected);
        element.classList.toggle('is-highlighted', isHighlighted);
        element.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });

      if (snapshot.open && !usesLocalPlacement) {
        this.positionPopover();
      } else {
        clearPopoverPosition();
      }

      return this;
    },

    positionPopover() {
      const snapshot = this.ensureState().getState();

      if (!snapshot.open || usesLocalPlacement || !trigger || !popover || !root) {
        return this;
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
      const triggerRect = trigger.getBoundingClientRect();

      popover.style.visibility = 'hidden';
      popover.style.top = '0px';
      popover.style.left = '0px';
      popover.style.minWidth = `${Math.round(triggerRect.width)}px`;
      popover.style.maxHeight = '';

      const initialRect = popover.getBoundingClientRect();
      const availableBelow = Math.max(0, maxBottom - triggerRect.bottom - VIEWPORT_GAP);
      const availableAbove = Math.max(0, triggerRect.top - minTop - VIEWPORT_GAP);
      const shouldOpenAbove = initialRect.height > availableBelow && availableAbove > availableBelow;
      const availableSpace = shouldOpenAbove ? availableAbove : availableBelow;

      if (availableSpace > 0) {
        popover.style.maxHeight = `${Math.floor(availableSpace)}px`;
      }

      const popoverRect = popover.getBoundingClientRect();
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

      root.classList.toggle('bp-ui-select--above', shouldOpenAbove);
      popover.style.left = `${Math.round(clampedLeft)}px`;
      popover.style.top = `${Math.round(clampedTop)}px`;
      popover.style.visibility = '';
      return this;
    },

    toggle() {
      return this.ensureState().getState().open ? this.closePopover() : this.openPopover();
    },

    openPopover() {
      const previous = this.ensureState().getState();
      const current = selectState.open();

      syncAdapterState(this, current);

      if (previous.open === current.open) {
        return this.open;
      }

      mountPopoverToBody();
      this.render();
      addOpenListeners();
      popover?.focus();
      return this.open;
    },

    closePopover({ restoreFocus = false } = {}) {
      const previous = this.ensureState().getState();
      const current = selectState.close();

      syncAdapterState(this, current);

      if (previous.open === current.open) {
        return this.open;
      }

      removeOpenListeners();
      this.render();
      restorePopover();

      if (restoreFocus) {
        trigger?.focus();
      }

      return this.open;
    },

    select(value, triggerSource = 'api') {
      void triggerSource;
      const current = this.ensureState().setValue(value);
      syncAdapterState(this, current);
      this.render();
      return this.value;
    },

    selectHighlighted(triggerSource = 'keyboard') {
      void triggerSource;
      const snapshot = this.ensureState().getState();
      const highlighted = snapshot.options[snapshot.highlightedIndex];

      if (!highlighted) {
        return this.value;
      }

      return this.select(highlighted.value, triggerSource);
    },

    isSelected(value) {
      return this.ensureState().getState().value === value;
    },

    ensureState() {
      if (!selectState) {
        selectState = createSelectState(resolveConfig(this, config));
        syncAdapterState(this, selectState.getState());
      }

      return selectState;
    },
  };

  return adapter;
}
