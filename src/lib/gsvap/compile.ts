import { pos as posSymbol, chld as chldSymbol } from "./symbols";
import { GsvapSubBuilderImpl } from "./builder";
import type { GsvapEntry, GsvapNamespace, TimelineVars } from "./types";

/**
 * Remove gsvap-specific symbol keys from resolved vars before handing them to GSAP.
 * `[pos]` and `[chld]` are internal config — GSAP has no awareness of them.
 * @internal
 */
function stripGsvapKeys(vars: TimelineVars): GSAPTweenVars {
  const result = { ...vars };
  delete (result as Record<symbol, unknown>)[posSymbol];
  delete (result as Record<symbol, unknown>)[chldSymbol];
  return result;
}

/**
 * Recursively compile a single entry (and any children declared via `[chld]`)
 * onto a GSAP timeline.
 *
 * This is the core of "play time" — called for every entry in the tree after
 * all `.el()` attachments have mounted and populated the registry.
 *
 * @param tl - The GSAP timeline being built.
 * @param entry - The gsvap entry to compile.
 * @param path - Full label path from root to this entry, e.g. `['group', 'title']`.
 *               Used to look up the node in the registry.
 * @param registry - Map of pipe-joined path keys (`'group|title'`) to mounted nodes.
 * @param index - Entry's zero-based position among its siblings. Passed as `$.index`.
 * @param defaultPos - Fallback GSAP position string if the entry omits `[pos]`.
 *                     `undefined` at the top level (GSAP appends sequentially).
 *                     `'<'` for children (simultaneous with parent by default).
 * @internal
 */
export function compileEntry(
  tl: gsap.core.Timeline,
  entry: GsvapEntry,
  path: string[],
  registry: Map<string, HTMLElement>,
  index: number,
  defaultPos: string | undefined,
): void {
  const key = path.join("|");
  const node = registry.get(key);

  // Node hasn't mounted or has been deregistered — skip silently.
  if (!node) return;

  const ns: GsvapNamespace = {
    node,
    index,
    pos: posSymbol,
    chld: chldSymbol,
  };

  // Resolve vars: call the factory with the live namespace, or use the raw object.
  let resolvedVars: TimelineVars;
  let fromVars: GSAPTweenVars | undefined;

  if (entry.method === "fromTo") {
    fromVars = entry.fromVars;
    resolvedVars =
      typeof entry.toVars === "function" ? entry.toVars(ns) : entry.toVars;
  } else {
    resolvedVars =
      typeof entry.vars === "function" ? entry.vars(ns) : entry.vars;
  }

  // Extract gsvap config before it reaches GSAP.
  const position = (resolvedVars[posSymbol] ?? defaultPos) as
    | gsap.Position
    | undefined;
  const subBuilderFactory = resolvedVars[chldSymbol];
  const gsapVars = stripGsvapKeys(resolvedVars);

  // Add the tween to the GSAP timeline.
  if (entry.method === "fromTo") {
    tl.fromTo(node, fromVars!, gsapVars, position);
  } else {
    tl[entry.method](node, gsapVars, position);
  }

  // Compile children recursively if a [chld] sub-builder was declared.
  // Children default to '<' (simultaneous with the parent tween) unless
  // they declare their own [pos].
  if (subBuilderFactory) {
    const builder = new GsvapSubBuilderImpl();
    subBuilderFactory(builder);

    builder._entries.forEach((childEntry, childIndex) => {
      compileEntry(
        tl,
        childEntry,
        [...path, childEntry.label],
        registry,
        childIndex,
        "<",
      );
    });
  }
}
