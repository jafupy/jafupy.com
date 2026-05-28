import gsap from "gsap";
import { GsvapBaseBuilder } from "./builder";
import { compileEntry } from "./compile";
import type { Attachment } from "./types";

/**
 * Full animation controller for orchestrating complex multi-element animations.
 * Built on GSAP timelines; managed through Svelte attachments.
 *
 * **Lifecycle:**
 * 1. **Define** — `.from()`, `.to()`, `.fromTo()` build the entry tree (no DOM access yet).
 * 2. **Register** — `{@attach tl.el(...)}` mounts elements and stores them in the registry.
 * 3. **Play** — `.play()` runs all factories with live nodes, compiles, and fires the GSAP timeline.
 *
 * @example
 * ```ts
 * import { gsvap, pos, chld } from 'gsvap'
 *
 * const tl = gsvap.tl()
 *   .from('header', { opacity: 0 })
 *   .from('card', { opacity: 0, y: 24 }, {
 *     [pos]: '<+0.15',
 *     [chld]: tl => tl
 *       .from('title', { opacity: 0 })
 *       .from('body',  { y: 8, [pos]: '<+0.05' }),
 *   })
 *
 * tl.play()
 * ```
 * ```svelte
 * <h1  {@attach tl.el('header')} />
 * <div {@attach tl.el('card')}>
 *   <h2 {@attach tl.el('card', 'title')} />
 *   <p  {@attach tl.el('card', 'body')}  />
 * </div>
 * ```
 */
export class GsvapTimeline extends GsvapBaseBuilder {
  /**
   * Registry of mounted nodes, keyed by pipe-joined label paths.
   * e.g. `'group|title'` for `tl.el('group', 'title')`.
   * @internal
   */
  private readonly registry = new Map<string, HTMLElement>();

  /**
   * Returns a Svelte attachment that registers the target element in the timeline registry.
   * The element is deregistered automatically when the attachment tears down
   * (element removed from DOM, or reactive params changed).
   *
   * Path segments form a hierarchy matching the `[chld]` structure in your entry definitions.
   * A single segment targets a top-level entry; multiple segments target a nested child.
   *
   * @param path - One or more label segments identifying this element's position in the tree.
   *
   * @example
   * ```svelte
   * <!-- top-level entry -->
   * <h1 {@attach tl.el('header')} />
   *
   * <!-- child of 'group' -->
   * <div {@attach tl.el('group')}>
   *   <span {@attach tl.el('group', 'title')} />
   *   <span {@attach tl.el('group', 'body')}  />
   * </div>
   *
   * <!-- deeply nested -->
   * <span {@attach tl.el('group', 'body', 'inner')} />
   * ```
   */
  el(...path: string[]): Attachment {
    const key = path.join("|");
    return (node: HTMLElement) => {
      this.registry.set(key, node);
      return () => {
        this.registry.delete(key);
      };
    };
  }

  /**
   * Compile all entries into a GSAP timeline and play it.
   *
   * This is "play time" — all factories receive live DOM nodes here.
   * Entries whose nodes haven't mounted are skipped silently.
   * Top-level entries are appended sequentially by default;
   * use `[pos]` to override positioning.
   *
   * @returns The compiled, playing `gsap.core.Timeline` instance.
   *          Hold onto this if you need to pause, reverse, or seek later.
   */
  play(): gsap.core.Timeline {
    this._gsapTimeline?.kill();
    this._gsapTimeline = gsap.timeline();

    this._entries.forEach((entry, index) => {
      compileEntry(
        this._gsapTimeline!,
        entry,
        [entry.label],
        this.registry,
        index,
        undefined,
      );
    });

    return this._gsapTimeline;
  }

  /**
   * Kill the current GSAP timeline and clear all registered nodes.
   * Call this before replaying, or when the component containing the
   * timeline is destroyed.
   *
   * Entries defined via `.from()`, `.to()`, `.fromTo()` are preserved —
   * only the compiled GSAP timeline and the node registry are cleared.
   * Re-attach elements in the template and call `.play()` again to replay.
   */
  reset(): void {
    this._gsapTimeline?.kill();
    this._gsapTimeline = null;
    // registry is intentionally preserved — attachments only fire on mount,
    // so clearing it would leave play() with nothing to compile against.
    // nodes are deregistered automatically when their attachment tears down.
  }

  /** @internal The compiled GSAP timeline, if played. */
  private _gsapTimeline: gsap.core.Timeline | null = null;
}

/** @internal */
export function createTimeline(): GsvapTimeline {
  return new GsvapTimeline();
}
