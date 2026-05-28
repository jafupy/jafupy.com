import gsap from "gsap";
import type { TransitionConfig } from "svelte/transition";
import type {
  Attachment,
  BaseVarsOrFactory,
  GsvapBaseNamespace,
} from "./types";

/**
 * Resolve base vars from a raw object or a factory.
 * @internal
 */
function resolveBaseVars(
  vars: BaseVarsOrFactory,
  node: HTMLElement,
  index: number,
): GSAPTweenVars {
  const ns: GsvapBaseNamespace = { node, index };
  return typeof vars === "function" ? vars(ns) : vars;
}

/**
 * A unified GSAP helper for Svelte transitions and attachments.
 *
 * ---
 *
 * **Attachment mode** — call with vars only, use with `{@attach}`:
 * ```svelte
 * <div {@attach gsvap({ x: 100, ease: 'power2.out' })}>...</div>
 *
 * <!-- factory: re-runs reactively when offset changes -->
 * <div {@attach gsvap($ => ({ x: offset, duration: 0.3 }))}>...</div>
 * ```
 * Runs `gsap.to()` on mount. Svelte tears down and re-evaluates the attachment
 * whenever reactive state in the expression changes — the old tween is killed,
 * a new one fires with the updated values.
 *
 * ---
 *
 * **Transition mode** — used via `in:`, `out:`, or `transition:` directives:
 * ```svelte
 * <div in:gsvap={{ opacity: 0, y: 20, ease: 'expo.out' }}>...</div>
 * <div transition:gsvap={$ => ({ opacity: 0, x: $.node.clientWidth * -0.2 })}>...</div>
 * ```
 * Builds a paused `gsap.from()` tween scrubbed by Svelte's `tick` callback.
 * - **Intro** (`t`: `0 → 1`): plays forward from `vars` to the element's natural state.
 * - **Outro** (`t`: `1 → 0`): reverses back to `vars` before the element is removed.
 *
 * Svelte's easing is set to linear — GSAP's easing curve is the sole driver.
 *
 * @param nodeOrVars - The element in transition mode (provided by Svelte),
 *                     or vars/factory in attachment mode (provided by you).
 * @param params - Vars or factory, only present in transition mode.
 */
export function gsvap(vars?: BaseVarsOrFactory): Attachment;
export function gsvap(
  node: HTMLElement,
  params?: BaseVarsOrFactory,
): TransitionConfig;
export function gsvap(
  nodeOrVars?: HTMLElement | BaseVarsOrFactory,
  params?: BaseVarsOrFactory,
): Attachment | TransitionConfig {
  // --- Attachment mode: gsvap(vars) or gsvap($ => vars) ---
  if (!(nodeOrVars instanceof HTMLElement)) {
    const vars = nodeOrVars ?? {};
    return (node: HTMLElement) => {
      const resolvedVars = resolveBaseVars(vars, node, 0);
      const tween = gsap.to(node, { duration: 2, ...resolvedVars });
      return () => tween.kill();
    };
  }

  // --- Transition mode: Svelte calls gsvap(node, params) ---
  const node = nodeOrVars;
  const vars = params ?? {};
  const resolvedVars = resolveBaseVars(vars, node, 0);
  const duration =
    ((resolvedVars.duration as number | undefined) ?? 0.15) * 1000;

  const tween = gsap.from(node, {
    duration: 2,
    ...resolvedVars,
    paused: true,
  });

  return {
    duration,
    /** Linear — GSAP's own easing curve is the sole driver. */
    easing: (t: number) => t,
    /** Scrub the paused tween to match Svelte's `t`. */
    tick: (t: number) => tween.progress(t),
  };
}
