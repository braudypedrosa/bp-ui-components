import { BPUIRadioGroup } from '../components/radio.js';
import { parseBooleanAttribute } from '../core/choice-options.js';

function syncAdapterState(adapter, controller) {
  const snapshot = controller.state.getState();
  adapter.value = snapshot.value;
  adapter.disabled = snapshot.disabled;
  adapter.size = snapshot.size;
  adapter.variant = snapshot.variant;
}

function resolveRoot(adapter) {
  if (!(adapter.$el instanceof Element)) {
    return null;
  }

  if (adapter.$el.matches('.bp-ui-radio')) {
    return adapter.$el;
  }

  return adapter.$el.querySelector('.bp-ui-radio');
}

function resolveConfig(adapter, config = {}) {
  const root = resolveRoot(adapter);
  const checkedInput = root?.querySelector('.bp-ui-radio__input:checked');

  return {
    value: config.value !== undefined
      ? config.value
      : (root?.hasAttribute('data-value') ? root.dataset.value : checkedInput?.value),
    name: config.name !== undefined ? config.name : root?.dataset.name,
    size: config.size !== undefined ? config.size : root?.dataset.size,
    variant: config.variant !== undefined ? config.variant : root?.dataset.variant,
    disabled: config.disabled !== undefined ? config.disabled : parseBooleanAttribute(root, 'data-disabled'),
  };
}

export function bpUIRadio(config = {}) {
  let controller = null;
  let root = null;
  let isInitialized = false;
  let liveAdapter = null;

  const handleChange = () => {
    if (!controller) {
      return;
    }

    syncAdapterState(liveAdapter || adapter, controller);
  };

  const adapter = {
    value: '',
    disabled: false,
    size: 'md',
    variant: 'default',

    init() {
      liveAdapter = this;

      if (!controller) {
        root = resolveRoot(this);

        if (!root) {
          throw new Error('Radio root element not found');
        }

        controller = new BPUIRadioGroup(root, resolveConfig(this, config));
      }

      if (!isInitialized && root) {
        root.addEventListener('bp-ui:radio:change', handleChange);
        isInitialized = true;
      }

      syncAdapterState(this, controller);
      return this;
    },

    select(value, trigger = 'api') {
      this.ensureController().setValue(value, trigger);
      syncAdapterState(this, controller);
      return this.value;
    },

    isSelected(value) {
      return this.ensureController().getValue() === value;
    },

    ensureController() {
      if (!controller) {
        this.init();
      }

      return controller;
    },
  };

  return adapter;
}
