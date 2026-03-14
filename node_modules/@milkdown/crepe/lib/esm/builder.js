import { EditorStatus, editorViewCtx, Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from '@milkdown/kit/core';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { history } from '@milkdown/kit/plugin/history';
import { indentConfig, indent } from '@milkdown/kit/plugin/indent';
import { listenerCtx, listener } from '@milkdown/kit/plugin/listener';
import { trailing } from '@milkdown/kit/plugin/trailing';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { getMarkdown } from '@milkdown/kit/utils';
import { createSlice } from '@milkdown/kit/ctx';

const FeaturesCtx = createSlice([], "FeaturesCtx");
const CrepeCtx = createSlice({}, "CrepeCtx");

var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var _editor, _rootElement, _editable;
class CrepeBuilder {
  /// The constructor of the crepe builder.
  /// You can pass configs to the builder to configure the editor.
  constructor({ root, defaultValue = "" } = {}) {
    /// @internal
    __privateAdd(this, _editor);
    /// @internal
    __privateAdd(this, _rootElement);
    /// @internal
    __privateAdd(this, _editable, true);
    /// Add a feature to the editor.
    this.addFeature = (feature, config) => {
      feature(__privateGet(this, _editor), config);
      return this;
    };
    /// Create the editor.
    this.create = () => {
      return __privateGet(this, _editor).create();
    };
    /// Destroy the editor.
    this.destroy = () => {
      return __privateGet(this, _editor).destroy();
    };
    /// Set the readonly mode of the editor.
    this.setReadonly = (value) => {
      __privateSet(this, _editable, !value);
      __privateGet(this, _editor).action((ctx) => {
        if (__privateGet(this, _editor).status === EditorStatus.Created) {
          const view = ctx.get(editorViewCtx);
          view.setProps({
            editable: () => !value
          });
        }
      });
      return this;
    };
    /// Get the markdown content of the editor.
    this.getMarkdown = () => {
      return __privateGet(this, _editor).action(getMarkdown());
    };
    /// Register event listeners.
    this.on = (fn) => {
      if (__privateGet(this, _editor).status !== EditorStatus.Created) {
        __privateGet(this, _editor).config((ctx) => {
          const listener2 = ctx.get(listenerCtx);
          fn(listener2);
        });
        return this;
      }
      __privateGet(this, _editor).action((ctx) => {
        const listener2 = ctx.get(listenerCtx);
        fn(listener2);
      });
      return this;
    };
    var _a;
    __privateSet(this, _rootElement, (_a = typeof root === "string" ? document.querySelector(root) : root) != null ? _a : document.body);
    __privateSet(this, _editor, Editor.make().config((ctx) => {
      ctx.inject(CrepeCtx, this);
      ctx.inject(FeaturesCtx, []);
    }).config((ctx) => {
      ctx.set(rootCtx, __privateGet(this, _rootElement));
      ctx.set(defaultValueCtx, defaultValue);
      ctx.set(editorViewOptionsCtx, {
        editable: () => __privateGet(this, _editable)
      });
      ctx.update(indentConfig.key, (value) => ({
        ...value,
        size: 4
      }));
    }).use(commonmark).use(listener).use(history).use(indent).use(trailing).use(clipboard).use(gfm));
  }
  /// Get the milkdown editor instance.
  get editor() {
    return __privateGet(this, _editor);
  }
  /// Get the readonly state of the editor.
  get readonly() {
    return !__privateGet(this, _editable);
  }
}
_editor = new WeakMap();
_rootElement = new WeakMap();
_editable = new WeakMap();

export { CrepeBuilder };
//# sourceMappingURL=builder.js.map
