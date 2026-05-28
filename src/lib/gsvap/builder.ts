import type {
  GsvapEntry,
  GsvapSubBuilder,
  TimelineVarsOrFactory,
} from "./types";

/**
 * Abstract base class shared by `GsvapTimeline` and `GsvapSubBuilderImpl`.
 * Provides the common `.from()`, `.to()`, `.fromTo()` entry registration methods.
 * @internal
 */
export abstract class GsvapBaseBuilder implements GsvapSubBuilder {
  /** @internal */
  readonly _entries: GsvapEntry[] = [];

  /**
   * Register a "from" tween — animates from `vars` to the element's natural DOM state.
   * @param label - Matches a `.el()` registration in the template.
   * @param vars - From-vars, or a factory called with the gsvap namespace at play time.
   */
  from(label: string, vars: TimelineVarsOrFactory): this {
    this._entries.push({ method: "from", label, vars });
    return this;
  }

  /**
   * Register a "to" tween — animates from the element's natural DOM state to `vars`.
   * @param label - Matches a `.el()` registration in the template.
   * @param vars - To-vars, or a factory called with the gsvap namespace at play time.
   */
  to(label: string, vars: TimelineVarsOrFactory): this {
    this._entries.push({ method: "to", label, vars });
    return this;
  }

  /**
   * Register a "fromTo" tween — both start and end states are explicitly defined.
   * Use this when the element's natural state is unreliable or may have changed
   * between animation runs.
   * @param label - Matches a `.el()` registration in the template.
   * @param fromVars - The starting state. Always static — no factory.
   * @param toVars - The ending state, or a factory called at play time.
   */
  fromTo(
    label: string,
    fromVars: GSAPTweenVars,
    toVars: TimelineVarsOrFactory,
  ): this {
    this._entries.push({ method: "fromTo", label, fromVars, toVars });
    return this;
  }
}

/**
 * Concrete sub-builder passed into `[chld]` factories.
 * Collects child entries to be compiled as tweens simultaneous with their parent,
 * unless a child specifies its own `[pos]`.
 */
export class GsvapSubBuilderImpl extends GsvapBaseBuilder {}
