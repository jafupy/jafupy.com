import type { TransitionConfig } from "svelte/transition";
import type { pos, chld } from "./symbols";

export type { TransitionConfig };

/** A Svelte attachment: receives a node on mount, returns a teardown function. */
export type Attachment = (node: HTMLElement) => () => void;

/**
 * Namespace passed into `gsvap()` factories.
 * Available in both transition and attachment contexts.
 */
export interface GsvapBaseNamespace {
  /** The element being animated. */
  node: HTMLElement;
  /**
   * Zero-based index of this entry among its siblings in the entry tree.
   * Useful for computing procedural offsets — e.g. `x: $.index * 40`.
   */
  index: number;
}

/**
 * Namespace passed into `gsvap.tl()` entry factories at play time.
 * Extends the base namespace with gsvap config symbols.
 *
 * @example
 * ```ts
 * tl.from('card', $ => ({
 *   opacity: 0,
 *   y: $.index * 10,
 *   [$.pos]: '<+0.1',
 *   [$.chld]: tl => tl
 *     .from('title', { opacity: 0 })
 *     .from('body',  { y: 8 }),
 * }))
 * ```
 */
export interface GsvapNamespace extends GsvapBaseNamespace {
  /**
   * The `pos` symbol, for use as a computed key inside a factory.
   * Value is the GSAP position string for this entry on the timeline.
   * @see https://gsap.com/docs/v3/GSAP/Timeline/ — position parameter
   */
  pos: typeof pos;
  /**
   * The `chld` symbol, for use as a computed key inside a factory.
   * Value must be a sub-builder factory: `tl => tl.from(...).to(...)`.
   */
  chld: typeof chld;
}

/**
 * GSAP tween vars merged with gsvap config.
 * `[pos]` and `[chld]` are extracted and stripped before vars reach GSAP.
 */
export type TimelineVars = GSAPTweenVars & {
  /**
   * GSAP position string for placing this tween on the timeline.
   * Defaults to sequential append if omitted.
   * @example `'<'` — simultaneous with previous; `'<+0.1'` — 0.1s after previous starts.
   */
  [pos]?: string;
  /**
   * Children sub-builder factory.
   * Receives a fresh builder, must return it (chained or direct).
   * Children default to `'<'` (simultaneous with parent) unless they specify their own `[pos]`.
   */
  [chld]?: (builder: GsvapSubBuilder) => GsvapSubBuilder;
};

/** A factory for timeline entry vars. Receives the full gsvap namespace at play time. */
export type TimelineFactory = (ns: GsvapNamespace) => TimelineVars;

/** Either static timeline vars or a factory that produces them. */
export type TimelineVarsOrFactory = TimelineVars | TimelineFactory;

/** A factory for `gsvap()` (transition + attachment). Receives the base namespace. */
export type BaseFactory = (ns: GsvapBaseNamespace) => GSAPTweenVars;

/** Either static GSAP vars or a base factory. */
export type BaseVarsOrFactory = GSAPTweenVars | BaseFactory;

/**
 * A single entry in the timeline's entry tree, produced by `.from()`, `.to()`, or `.fromTo()`.
 * @internal
 */
export type GsvapEntry =
  | { method: "from" | "to"; label: string; vars: TimelineVarsOrFactory }
  | {
      method: "fromTo";
      label: string;
      fromVars: GSAPTweenVars;
      toVars: TimelineVarsOrFactory;
    };

/**
 * The builder interface exposed inside `[chld]` factories.
 * Mirrors the root timeline's `.from()`, `.to()`, `.fromTo()` API
 * but without `.el()` or `.play()` — children are DOM-managed by their parent.
 */
export interface GsvapSubBuilder {
  /**
   * Add a "from" tween for a child label.
   * @param label - Must match a `.el(parentLabel, childLabel)` attachment in the template.
   * @param vars - GSAP from-vars, or a factory receiving the namespace at play time.
   */
  from(label: string, vars: TimelineVarsOrFactory): this;
  /**
   * Add a "to" tween for a child label.
   * @param label - Must match a `.el(parentLabel, childLabel)` attachment in the template.
   * @param vars - GSAP to-vars, or a factory receiving the namespace at play time.
   */
  to(label: string, vars: TimelineVarsOrFactory): this;
  /**
   * Add a "fromTo" tween for a child label.
   * @param label - Must match a `.el(parentLabel, childLabel)` attachment in the template.
   * @param fromVars - The starting state. Always static vars — no factory.
   * @param toVars - The ending state, or a factory receiving the namespace at play time.
   */
  fromTo(
    label: string,
    fromVars: GSAPTweenVars,
    toVars: TimelineVarsOrFactory,
  ): this;
  /** @internal Accessed during compilation to walk the entry tree. */
  readonly _entries: GsvapEntry[];
}
