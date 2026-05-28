<script lang="ts">
  import { gsap } from "gsap";
  import type { Snippet } from "svelte";
  import { tick } from "svelte";
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

      if (!split.chars.length) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(split.chars, { clearProps: "all" });
        split.revert();
        split = null;
        return;
      }

      tween = gsap.fromTo(
        split.chars,
        {
          y: "0.45em",
          opacity: 0,
          filter: "blur(5px)",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.34,
          ease: "power3.out",
          stagger: 0.006,
          clearProps: "transform,opacity,filter",
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
