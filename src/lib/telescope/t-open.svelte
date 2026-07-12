<script lang="ts">
  import { gsap } from "gsap";
  import type { Snippet } from "svelte";
  import { tick } from "svelte";
  import { prefersReducedMotion, TELESCOPE_TEXT_MOTION } from "./motion";
  import { getTelescopeContext } from "./telescope-context.svelte";
  import { splitOwnText, type TextSplit } from "./text-split";

  type Props = {
    children: Snippet;
    class?: string;
  };

  let { children, class: className = "" }: Props = $props();

  const telescope = getTelescopeContext();

  function revealText(node: HTMLElement) {
    let cancelled = false;
    let split: TextSplit | null = null;
    let tween: gsap.core.Tween | null = null;

    tick().then(() => {
      if (cancelled || !node.isConnected) return;

      split = splitOwnText(node);

      if (!split.chars.length) {
        split.revert();
        split = null;
        return;
      }

      if (prefersReducedMotion()) {
        gsap.set(split.chars, { clearProps: "all" });
        split.revert();
        split = null;
        return;
      }

      tween = gsap.fromTo(
        split.chars,
        {
          y: TELESCOPE_TEXT_MOTION.y,
          opacity: 0,
          filter: TELESCOPE_TEXT_MOTION.blur,
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: TELESCOPE_TEXT_MOTION.duration,
          ease: TELESCOPE_TEXT_MOTION.easeOut,
          stagger: TELESCOPE_TEXT_MOTION.stagger,
          clearProps: TELESCOPE_TEXT_MOTION.clearProps,
          onComplete: () => {
            split?.revert();
            split = null;
            tween = null;
          },
        },
      );
    });

    return {
      destroy() {
        cancelled = true;
        tween?.kill();
        split?.revert();
      },
    };
  }
</script>

{#if telescope.getOpen()}
  <span
    use:revealText
    class={[
      "inline whitespace-pre-wrap",
      className,
    ].join(" ")}
  >
    {@render children()}
  </span>
{/if}
