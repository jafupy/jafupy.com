import { gsvap as _gsvap } from "./transition";
import { createTimeline } from "./timeline";

export { pos, chld } from "./symbols";
export type {
  Attachment,
  GsvapBaseNamespace,
  GsvapNamespace,
  GsvapSubBuilder,
  TimelineVars,
  TimelineFactory,
  TimelineVarsOrFactory,
  BaseFactory,
  BaseVarsOrFactory,
} from "./types";
export type { GsvapTimeline } from "./timeline";

/**
 * GSvAP — Green Svelte Animation Platform.
 *
 * Three modes in one import:
 *
 * **Transition**
 * ```svelte
 * <div in:gsvap={{ opacity: 0, y: 20, ease: 'expo.out' }}>...</div>
 * ```
 *
 * **Attachment** (reactive)
 * ```svelte
 * <div {@attach gsvap($ => ({ x: offset }))}>...</div>
 * ```
 *
 * **Timeline controller**
 * ```ts
 * import { gsvap, pos, chld } from 'gsvap'
 *
 * const tl = gsvap.tl()
 *   .from('header', { opacity: 0 })
 *   .from('card', $ => ({
 *     opacity: 0,
 *     y: $.index * 12,
 *     [$.pos]: '<+0.1',
 *     [$.chld]: tl => tl
 *       .from('title', { opacity: 0 })
 *       .from('body',  { y: 8 }),
 *   }))
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
export const gsvap = Object.assign(_gsvap, {
  /**
   * Create a new `GsvapTimeline` animation controller.
   *
   * Define the sequence with `.from()`, `.to()`, `.fromTo()`.
   * Register elements in your template with `{@attach tl.el(...)}`.
   * Fire with `tl.play()`.
   */
  tl: createTimeline,
});
