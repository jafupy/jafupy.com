import { PluginKey, Plugin } from "@milkdown/prose/state";
import { $ctx, $prose } from "@milkdown/utils";
const trailingConfig = $ctx(
  {
    shouldAppend: (lastNode) => {
      if (!lastNode) return false;
      if (["heading", "paragraph"].includes(lastNode.type.name)) return false;
      return true;
    },
    getNode: (state) => state.schema.nodes.paragraph.create()
  },
  "trailingConfig"
);
trailingConfig.meta = {
  package: "@milkdown/plugin-trailing",
  displayName: "Ctx<trailingConfig>"
};
const trailingPlugin = $prose((ctx) => {
  const trailingPluginKey = new PluginKey("MILKDOWN_TRAILING");
  const { shouldAppend, getNode } = ctx.get(trailingConfig.key);
  const plugin = new Plugin({
    key: trailingPluginKey,
    state: {
      init: (_, state) => {
        const lastNode = state.tr.doc.lastChild;
        return shouldAppend(lastNode, state);
      },
      apply: (tr, value, _, state) => {
        if (!tr.docChanged) return value;
        const lastNode = tr.doc.lastChild;
        return shouldAppend(lastNode, state);
      }
    },
    appendTransaction: (_, __, state) => {
      const { doc, tr } = state;
      const nodeType = getNode?.(state);
      const shouldInsertNodeAtEnd = plugin.getState(state);
      const endPosition = doc.content.size;
      if (!shouldInsertNodeAtEnd || !nodeType) return;
      return tr.insert(endPosition, nodeType);
    }
  });
  return plugin;
});
trailingPlugin.meta = {
  package: "@milkdown/plugin-trailing",
  displayName: "Prose<trailing>"
};
const trailing = [trailingConfig, trailingPlugin];
export {
  trailing,
  trailingConfig,
  trailingPlugin
};
//# sourceMappingURL=index.js.map
