export type TextSplit = {
  chars: HTMLElement[];
  revert: () => void;
};

const WORD_CLASS = "inline-block whitespace-nowrap";
const CHAR_CLASS = "inline-block will-change-[transform,opacity,filter]";

function isInsideNestedTelescope(node: Node, root: HTMLElement) {
  let current = node.parentElement;

  while (current && current !== root) {
    if (current.hasAttribute("data-telescope-root")) return true;
    current = current.parentElement;
  }

  return false;
}

function makeCharSpan(char: string) {
  const span = document.createElement("span");
  span.className = CHAR_CLASS;
  span.textContent = char;
  return span;
}

function makeWordSpan(word: string, chars: HTMLElement[]) {
  const span = document.createElement("span");
  span.className = WORD_CLASS;

  for (const char of Array.from(word)) {
    const charSpan = makeCharSpan(char);
    chars.push(charSpan);
    span.appendChild(charSpan);
  }

  return span;
}

export function splitOwnText(root: HTMLElement): TextSplit {
  const textNodes: Text[] = [];
  const chars: HTMLElement[] = [];

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Important: skip nested telescopes BEFORE accepting whitespace.
        // Otherwise whitespace nodes inside nested Svelte subtrees can still be replaced.
        if (isInsideNestedTelescope(node, root)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  const replacements: Array<{ original: Text; inserted: Node[] }> = [];

  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    const value = textNode.textContent ?? "";
    if (!parent || value === "") continue;

    const fragment = document.createDocumentFragment();
    const inserted: Node[] = [];
    const parts = value.match(/\s+|\S+/g) ?? [];

    for (const part of parts) {
      const node = /^\s+$/.test(part)
        ? document.createTextNode(part)
        : makeWordSpan(part, chars);

      inserted.push(node);
      fragment.appendChild(node);
    }

    parent.replaceChild(fragment, textNode);
    replacements.push({ original: textNode, inserted });
  }

  let reverted = false;

  return {
    chars,
    revert() {
      if (reverted) return;
      reverted = true;

      for (const { original, inserted } of replacements.reverse()) {
        const first = inserted.find((node) => node.parentNode);
        const parent = first?.parentNode;
        if (!parent || !first) continue;

        parent.insertBefore(original, first);

        for (const node of inserted) {
          if (node.parentNode === parent) {
            parent.removeChild(node);
          }
        }
      }
    },
  };
}
