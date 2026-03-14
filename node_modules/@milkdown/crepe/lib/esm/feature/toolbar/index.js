import { tooltipFactory, TooltipProvider } from '@milkdown/kit/plugin/tooltip';
import { NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import { defineComponent, computed, h, Fragment, ref, shallowRef, createApp } from 'vue';
import { createSlice } from '@milkdown/kit/ctx';
import { Icon } from '@milkdown/kit/component';
import { commandsCtx, editorCtx, EditorStatus } from '@milkdown/kit/core';
import clsx from 'clsx';
import { toggleLinkCommand } from '@milkdown/kit/component/link-tooltip';
import { toggleStrongCommand, isMarkSelectedCommand, strongSchema, toggleEmphasisCommand, emphasisSchema, toggleInlineCodeCommand, inlineCodeSchema, isNodeSelectedCommand, linkSchema } from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand, strikethroughSchema } from '@milkdown/kit/preset/gfm';
import { findNodeInSelection } from '@milkdown/kit/prose';
import { $nodeSchema, $command } from '@milkdown/kit/utils';
import katex from 'katex';

createSlice([], "FeaturesCtx");
createSlice({}, "CrepeCtx");
function useCrepeFeatures(ctx) {
  return ctx.use("FeaturesCtx");
}
function crepeFeatureConfig(feature) {
  return (ctx) => {
    useCrepeFeatures(ctx).update((features) => {
      if (features.includes(feature)) {
        return features;
      }
      return [...features, feature];
    });
  };
}

var CrepeFeature = /* @__PURE__ */ ((CrepeFeature2) => {
  CrepeFeature2["CodeMirror"] = "code-mirror";
  CrepeFeature2["ListItem"] = "list-item";
  CrepeFeature2["LinkTooltip"] = "link-tooltip";
  CrepeFeature2["Cursor"] = "cursor";
  CrepeFeature2["ImageBlock"] = "image-block";
  CrepeFeature2["BlockEdit"] = "block-edit";
  CrepeFeature2["Toolbar"] = "toolbar";
  CrepeFeature2["Placeholder"] = "placeholder";
  CrepeFeature2["Table"] = "table";
  CrepeFeature2["Latex"] = "latex";
  return CrepeFeature2;
})(CrepeFeature || {});

const boldIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      d="M8.85758 18.625C8.4358 18.625 8.07715 18.4772 7.78163 18.1817C7.48613 17.8862 7.33838 17.5275 7.33838 17.1058V6.8942C7.33838 6.47242 7.48613 6.11377 7.78163 5.81825C8.07715 5.52275 8.4358 5.375 8.85758 5.375H12.1999C13.2191 5.375 14.1406 5.69231 14.9643 6.32693C15.788 6.96154 16.1999 7.81603 16.1999 8.89038C16.1999 9.63779 16.0194 10.2471 15.6585 10.7183C15.2976 11.1894 14.9088 11.5314 14.4922 11.7442C15.005 11.9211 15.4947 12.2708 15.9614 12.7933C16.428 13.3157 16.6614 14.0192 16.6614 14.9038C16.6614 16.182 16.1902 17.1217 15.2479 17.723C14.3056 18.3243 13.3563 18.625 12.3999 18.625H8.85758ZM9.4883 16.6327H12.3191C13.1063 16.6327 13.6627 16.4141 13.9884 15.9769C14.314 15.5397 14.4768 15.1205 14.4768 14.7192C14.4768 14.3179 14.314 13.8987 13.9884 13.4615C13.6627 13.0243 13.0909 12.8057 12.273 12.8057H9.4883V16.6327ZM9.4883 10.875H12.0826C12.6903 10.875 13.172 10.7013 13.5278 10.3539C13.8836 10.0064 14.0615 9.59037 14.0615 9.10575C14.0615 8.59035 13.8733 8.16918 13.497 7.84225C13.1207 7.51533 12.6595 7.35188 12.1133 7.35188H9.4883V10.875Z"
    />
  </svg>
`;

const codeIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <g clip-path="url(#clip0_977_8081)">
      <path
        d="M9.4 16.6L4.8 12L9.4 7.4L8 6L2 12L8 18L9.4 16.6ZM14.6 16.6L19.2 12L14.6 7.4L16 6L22 12L16 18L14.6 16.6Z"
      />
    </g>
    <defs>
      <clipPath id="clip0_977_8081">
        <rect width="24" height="24" />
      </clipPath>
    </defs>
  </svg>
`;

const italicIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      d="M6.29811 18.625C6.04505 18.625 5.83115 18.5375 5.65641 18.3626C5.48166 18.1877 5.39429 17.9736 5.39429 17.7203C5.39429 17.467 5.48166 17.2532 5.65641 17.0788C5.83115 16.9045 6.04505 16.8173 6.29811 16.8173H9.21159L12.452 7.18265H9.53851C9.28545 7.18265 9.07155 7.0952 8.89681 6.9203C8.72206 6.7454 8.63469 6.5313 8.63469 6.278C8.63469 6.02472 8.72206 5.81089 8.89681 5.63652C9.07155 5.46217 9.28545 5.375 9.53851 5.375H16.8847C17.1377 5.375 17.3516 5.46245 17.5264 5.63735C17.7011 5.81225 17.7885 6.02634 17.7885 6.27962C17.7885 6.53293 17.7011 6.74676 17.5264 6.92113C17.3516 7.09548 17.1377 7.18265 16.8847 7.18265H14.2789L11.0385 16.8173H13.6443C13.8973 16.8173 14.1112 16.9048 14.286 17.0797C14.4607 17.2546 14.5481 17.4687 14.5481 17.722C14.5481 17.9752 14.4607 18.1891 14.286 18.3634C14.1112 18.5378 13.8973 18.625 13.6443 18.625H6.29811Z"
    />
  </svg>
`;

const linkIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      d="M17.0385 19.5003V16.5388H14.0769V15.0388H17.0385V12.0773H18.5384V15.0388H21.5V16.5388H18.5384V19.5003H17.0385ZM10.8077 16.5388H7.03845C5.78282 16.5388 4.7125 16.0963 3.8275 15.2114C2.9425 14.3266 2.5 13.2564 2.5 12.0009C2.5 10.7454 2.9425 9.67504 3.8275 8.78979C4.7125 7.90454 5.78282 7.46191 7.03845 7.46191H10.8077V8.96186H7.03845C6.1987 8.96186 5.48235 9.25834 4.8894 9.85129C4.29645 10.4442 3.99998 11.1606 3.99998 12.0003C3.99998 12.8401 4.29645 13.5564 4.8894 14.1494C5.48235 14.7423 6.1987 15.0388 7.03845 15.0388H10.8077V16.5388ZM8.25 12.7503V11.2504H15.75V12.7503H8.25ZM21.5 12.0003H20C20 11.1606 19.7035 10.4442 19.1106 9.85129C18.5176 9.25834 17.8013 8.96186 16.9615 8.96186H13.1923V7.46191H16.9615C18.2171 7.46191 19.2875 7.90441 20.1725 8.78939C21.0575 9.67439 21.5 10.7447 21.5 12.0003Z"
    />
  </svg>
`;

const strikethroughIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      d="M3.25 13.7404C3.0375 13.7404 2.85938 13.6684 2.71563 13.5246C2.57188 13.3808 2.5 13.2026 2.5 12.99C2.5 12.7774 2.57188 12.5993 2.71563 12.4558C2.85938 12.3122 3.0375 12.2404 3.25 12.2404H20.75C20.9625 12.2404 21.1406 12.3123 21.2843 12.4561C21.4281 12.5999 21.5 12.7781 21.5 12.9907C21.5 13.2033 21.4281 13.3814 21.2843 13.525C21.1406 13.6686 20.9625 13.7404 20.75 13.7404H3.25ZM10.9423 10.2596V6.62495H6.5673C6.2735 6.62495 6.02377 6.52201 5.8181 6.31613C5.61245 6.11026 5.50963 5.86027 5.50963 5.56615C5.50963 5.27205 5.61245 5.02083 5.8181 4.8125C6.02377 4.60417 6.2735 4.5 6.5673 4.5H17.4423C17.7361 4.5 17.9858 4.60294 18.1915 4.80883C18.3971 5.01471 18.5 5.2647 18.5 5.5588C18.5 5.85292 18.3971 6.10413 18.1915 6.31245C17.9858 6.52078 17.7361 6.62495 17.4423 6.62495H13.0673V10.2596H10.9423ZM10.9423 15.7211H13.0673V18.4423C13.0673 18.7361 12.9643 18.9858 12.7584 19.1915C12.5526 19.3971 12.3026 19.5 12.0085 19.5C11.7144 19.5 11.4631 19.3962 11.2548 19.1887C11.0465 18.9811 10.9423 18.7291 10.9423 18.4327V15.7211Z"
    />
  </svg>
`;

const functionsIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M7 19v-.808L13.096 12L7 5.808V5h10v1.25H9.102L14.727 12l-5.625 5.77H17V19z"
    />
  </svg>
`;

var __typeError$1 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck$1 = (obj, member, msg) => member.has(obj) || __typeError$1("Cannot " + msg);
var __privateGet$1 = (obj, member, getter) => (__accessCheck$1(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd$1 = (obj, member, value) => member.has(obj) ? __typeError$1("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet$1 = (obj, member, value, setter) => (__accessCheck$1(obj, member, "write to private field"), member.set(obj, value), value);
var _groups, _getGroupInstance;
class GroupBuilder {
  constructor() {
    __privateAdd$1(this, _groups, []);
    this.clear = () => {
      __privateSet$1(this, _groups, []);
      return this;
    };
    __privateAdd$1(this, _getGroupInstance, (group) => {
      const groupInstance = {
        group,
        addItem: (key, item) => {
          const data = { ...item, key };
          group.items.push(data);
          return groupInstance;
        },
        clear: () => {
          group.items = [];
          return groupInstance;
        }
      };
      return groupInstance;
    });
    this.addGroup = (key, label) => {
      const items = [];
      const group = {
        key,
        label,
        items
      };
      __privateGet$1(this, _groups).push(group);
      return __privateGet$1(this, _getGroupInstance).call(this, group);
    };
    this.getGroup = (key) => {
      const group = __privateGet$1(this, _groups).find((group2) => group2.key === key);
      if (!group) throw new Error(`Group with key ${key} not found`);
      return __privateGet$1(this, _getGroupInstance).call(this, group);
    };
    this.build = () => {
      return __privateGet$1(this, _groups);
    };
  }
}
_groups = new WeakMap();
_getGroupInstance = new WeakMap();

const mathInlineId = "math_inline";
const mathInlineSchema = $nodeSchema(mathInlineId, () => ({
  group: "inline",
  inline: true,
  draggable: true,
  atom: true,
  attrs: {
    value: {
      default: ""
    }
  },
  parseDOM: [
    {
      tag: `span[data-type="${mathInlineId}"]`,
      getAttrs: (dom) => {
        var _a;
        return {
          value: (_a = dom.dataset.value) != null ? _a : ""
        };
      }
    }
  ],
  toDOM: (node) => {
    const code = node.attrs.value;
    const dom = document.createElement("span");
    dom.dataset.type = mathInlineId;
    dom.dataset.value = code;
    katex.render(code, dom, {
      throwOnError: false
    });
    return dom;
  },
  parseMarkdown: {
    match: (node) => node.type === "inlineMath",
    runner: (state, node, type) => {
      state.addNode(type, { value: node.value });
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === mathInlineId,
    runner: (state, node) => {
      state.addNode("inlineMath", void 0, node.attrs.value);
    }
  }
}));

const toggleLatexCommand = $command("ToggleLatex", (ctx) => {
  return () => (state, dispatch) => {
    const {
      hasNode: hasLatex,
      pos: latexPos,
      target: latexNode
    } = findNodeInSelection(state, mathInlineSchema.type(ctx));
    const { selection, doc, tr } = state;
    if (!hasLatex) {
      const text = doc.textBetween(selection.from, selection.to);
      let _tr2 = tr.replaceSelectionWith(
        mathInlineSchema.type(ctx).create({
          value: text
        })
      );
      if (dispatch) {
        dispatch(
          _tr2.setSelection(NodeSelection.create(_tr2.doc, selection.from))
        );
      }
      return true;
    }
    const { from, to } = selection;
    if (!latexNode || latexPos < 0) return false;
    let _tr = tr.delete(latexPos, latexPos + 1);
    const content = latexNode.attrs.value;
    _tr = _tr.insertText(content, latexPos);
    if (dispatch) {
      dispatch(
        _tr.setSelection(
          TextSelection.create(_tr.doc, from, to + content.length - 1)
        )
      );
    }
    return true;
  };
});

function getGroups(config, ctx) {
  var _a, _b, _c, _d, _e, _f, _g;
  const groupBuilder = new GroupBuilder();
  groupBuilder.addGroup("formatting", "Formatting").addItem("bold", {
    icon: (_a = config == null ? void 0 : config.boldIcon) != null ? _a : boldIcon,
    active: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      return commands.call(isMarkSelectedCommand.key, strongSchema.type(ctx2));
    },
    onRun: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      commands.call(toggleStrongCommand.key);
    }
  }).addItem("italic", {
    icon: (_b = config == null ? void 0 : config.italicIcon) != null ? _b : italicIcon,
    active: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      return commands.call(
        isMarkSelectedCommand.key,
        emphasisSchema.type(ctx2)
      );
    },
    onRun: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      commands.call(toggleEmphasisCommand.key);
    }
  }).addItem("strikethrough", {
    icon: (_c = config == null ? void 0 : config.strikethroughIcon) != null ? _c : strikethroughIcon,
    active: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      return commands.call(
        isMarkSelectedCommand.key,
        strikethroughSchema.type(ctx2)
      );
    },
    onRun: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      commands.call(toggleStrikethroughCommand.key);
    }
  });
  const functionGroup = groupBuilder.addGroup("function", "Function");
  functionGroup.addItem("code", {
    icon: (_d = config == null ? void 0 : config.codeIcon) != null ? _d : codeIcon,
    active: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      return commands.call(
        isMarkSelectedCommand.key,
        inlineCodeSchema.type(ctx2)
      );
    },
    onRun: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      commands.call(toggleInlineCodeCommand.key);
    }
  });
  const flags = ctx && useCrepeFeatures(ctx).get();
  const isLatexEnabled = flags == null ? void 0 : flags.includes(CrepeFeature.Latex);
  if (isLatexEnabled) {
    functionGroup.addItem("latex", {
      icon: (_e = config == null ? void 0 : config.latexIcon) != null ? _e : functionsIcon,
      active: (ctx2) => {
        const commands = ctx2.get(commandsCtx);
        return commands.call(
          isNodeSelectedCommand.key,
          mathInlineSchema.type(ctx2)
        );
      },
      onRun: (ctx2) => {
        const commands = ctx2.get(commandsCtx);
        commands.call(toggleLatexCommand.key);
      }
    });
  }
  functionGroup.addItem("link", {
    icon: (_f = config == null ? void 0 : config.linkIcon) != null ? _f : linkIcon,
    active: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      return commands.call(isMarkSelectedCommand.key, linkSchema.type(ctx2));
    },
    onRun: (ctx2) => {
      const commands = ctx2.get(commandsCtx);
      commands.call(toggleLinkCommand.key);
    }
  });
  (_g = config == null ? void 0 : config.buildToolbar) == null ? void 0 : _g.call(config, groupBuilder);
  return groupBuilder.build();
}

const Toolbar = defineComponent({
  props: {
    ctx: {
      type: Object,
      required: true
    },
    hide: {
      type: Function,
      required: true
    },
    show: {
      type: Object,
      required: true
    },
    selection: {
      type: Object,
      required: true
    },
    config: {
      type: Object,
      required: false
    }
  },
  setup(props) {
    const { ctx, config } = props;
    const onClick = (fn) => (e) => {
      e.preventDefault();
      ctx && fn(ctx);
    };
    function checkActive(checker) {
      props.selection.value;
      const status = ctx.get(editorCtx).status;
      if (status !== EditorStatus.Created) return false;
      return checker(ctx);
    }
    const groupInfo = computed(() => getGroups(config, ctx));
    return () => {
      return /* @__PURE__ */ h(Fragment, null, groupInfo.value.map((group) => {
        return group.items.map((item) => {
          return /* @__PURE__ */ h(
            "button",
            {
              type: "button",
              class: clsx(
                "toolbar-item",
                ctx && checkActive(item.active) && "active"
              ),
              onPointerdown: onClick(item.onRun)
            },
            /* @__PURE__ */ h(Icon, { icon: item.icon })
          );
        });
      }).reduce((acc, curr, index) => {
        if (index === 0) {
          acc.push(...curr);
        } else {
          acc.push(/* @__PURE__ */ h("div", { class: "divider" }), ...curr);
        }
        return acc;
      }, []));
    };
  }
});

var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var _tooltipProvider, _content, _app, _selection, _show;
const toolbarTooltip = tooltipFactory("CREPE_TOOLBAR");
class ToolbarView {
  constructor(ctx, view, config) {
    __privateAdd(this, _tooltipProvider);
    __privateAdd(this, _content);
    __privateAdd(this, _app);
    __privateAdd(this, _selection);
    __privateAdd(this, _show, ref(false));
    this.update = (view, prevState) => {
      __privateGet(this, _tooltipProvider).update(view, prevState);
      __privateGet(this, _selection).value = view.state.selection;
    };
    this.destroy = () => {
      __privateGet(this, _tooltipProvider).destroy();
      __privateGet(this, _app).unmount();
      __privateGet(this, _content).remove();
    };
    this.hide = () => {
      __privateGet(this, _tooltipProvider).hide();
    };
    const content = document.createElement("div");
    content.className = "milkdown-toolbar";
    __privateSet(this, _selection, shallowRef(view.state.selection));
    const app = createApp(Toolbar, {
      ctx,
      hide: this.hide,
      config,
      selection: __privateGet(this, _selection),
      show: __privateGet(this, _show)
    });
    app.mount(content);
    __privateSet(this, _content, content);
    __privateSet(this, _app, app);
    __privateSet(this, _tooltipProvider, new TooltipProvider({
      content: __privateGet(this, _content),
      debounce: 20,
      offset: 10,
      shouldShow(view2) {
        const { doc, selection } = view2.state;
        const { empty, from, to } = selection;
        const isEmptyTextBlock = !doc.textBetween(from, to).length && selection instanceof TextSelection;
        const isNotTextBlock = !(selection instanceof TextSelection);
        const activeElement = view2.dom.getRootNode().activeElement;
        const isTooltipChildren = content.contains(activeElement);
        const notHasFocus = !view2.hasFocus() && !isTooltipChildren;
        const isReadonly = !view2.editable;
        if (notHasFocus || isNotTextBlock || empty || isEmptyTextBlock || isReadonly)
          return false;
        return true;
      }
    }));
    __privateGet(this, _tooltipProvider).onShow = () => {
      __privateGet(this, _show).value = true;
    };
    __privateGet(this, _tooltipProvider).onHide = () => {
      __privateGet(this, _show).value = false;
    };
    this.update(view);
  }
}
_tooltipProvider = new WeakMap();
_content = new WeakMap();
_app = new WeakMap();
_selection = new WeakMap();
_show = new WeakMap();
const toolbar = (editor, config) => {
  editor.config(crepeFeatureConfig(CrepeFeature.Toolbar)).config((ctx) => {
    ctx.set(toolbarTooltip.key, {
      view: (view) => new ToolbarView(ctx, view, config)
    });
  }).use(toolbarTooltip);
};

export { toolbar };
//# sourceMappingURL=index.js.map
