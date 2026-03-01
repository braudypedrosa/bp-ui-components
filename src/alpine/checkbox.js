import { BPUICheckboxGroup } from '../components/checkbox.js';
import { parseBooleanAttribute } from '../core/choice-options.js';

function syncAdapterState(adapter, controller) {
  const snapshot = controller.state.getState();
  adapter.values = [...snapshot.values];
  adapter.disabled = snapshot.disabled;
  adapter.size = snapshot.size;
  adapter.variant = snapshot.variant;
}

function resolveRoot(adapter) {
  if (!(adapter.$el instanceof Element)) {
    return null;
  }

  if (adapter.$el.matches('.bp-ui-checkbox')) {
    return adapter.$el;
  }

  return adapter.$el.querySelector('.bp-ui-checkbox');
}

function resolveConfig(adapter, config = {}) {
  const root = resolveRoot(adapter);
  const checkedInputs = Array.from(root?.querySelectorAll('.bp-ui-checkbox__input:checked') || []);

  return {
    values: config.values !== undefined
      ? config.values
      : (root?.hasAttribute('data-values')
        ? root.dataset.values.split(',').map((value) => value.trim()).filter(Boolean)
        : checkedInputs.map((input) => input.value)),
    name: config.name !== undefined ? config.name : root?.dataset.name,
    size: config.size !== undefined ? config.size : root?.dataset.size,
    variant: config.variant !== undefined ? config.variant : root?.dataset.variant,
    disabled: config.disabled !== undefined ? config.disabled : parseBooleanAttribute(root, 'data-disabled'),
  };
}

export function bpUICheckbox(config = {}) {
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
    values: [],
    disabled: false,
    size: 'md',
    variant: 'default',

    init() {
      liveAdapter = this;

      if (!controller) {
        root = resolveRoot(this);

        if (!root) {
          throw new Error('Checkbox root element not found');
        }

        controller = new BPUICheckboxGroup(root, resolveConfig(this, config));
      }

      if (!isInitialized && root) {
        root.addEventListener('bp-ui:checkbox:change', handleChange);
        isInitialized = true;
      }

      syncAdapterState(this, controller);
      return this;
    },

    toggle(value, trigger = 'api') {
      this.ensureController().toggleValue(value, trigger);
      syncAdapterState(this, controller);
      return [...this.values];
    },

    setValues(values, trigger = 'api') {
      this.ensureController().setValues(values, trigger);
      syncAdapterState(this, controller);
      return [...this.values];
    },

    clear(trigger = 'api') {
      this.ensureController().clear(trigger);
      syncAdapterState(this, controller);
      return [...this.values];
    },

    isSelected(value) {
      return this.ensureController().getValues().includes(value);
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
