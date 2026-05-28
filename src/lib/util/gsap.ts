import { gsap as gsapLib } from "gsap";
import type { Attachment } from "svelte/attachments";

type GsapSelector = ReturnType<typeof gsapLib.utils.selector>;

export type GsapHelpers = {
  gsap: typeof gsapLib;
  selector: GsapSelector;
};

export type GsapSetup<T = void> = (
  node: HTMLElement,
  value: T,
  helpers: GsapHelpers,
) => void | (() => void);

export function createGsapAttachment(
  setup: GsapSetup<void>,
): Attachment<HTMLElement>;
export function createGsapAttachment<T>(
  setup: GsapSetup<T>,
  value: T,
): Attachment<HTMLElement>;
export function createGsapAttachment<T>(
  setup: GsapSetup<T>,
  value?: T,
): Attachment<HTMLElement> {
  return (node) => {
    let cleanup: void | (() => void);

    const context = gsapLib.context(() => {
      cleanup = setup(node, value as T, {
        gsap: gsapLib,
        selector: gsapLib.utils.selector(node),
      });
    }, node);

    return () => {
      cleanup?.();
      context.revert();
    };
  };
}
