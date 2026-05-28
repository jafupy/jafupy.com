<script lang="ts">
  import { gsap } from "gsap";
  import { SplitText } from "gsap/SplitText.js";
  import type { Snippet } from "svelte";
  import { getTelescopeContext } from "./telescope-context.svelte";

  type Props = {
    children: Snippet;
    class?: string;
  };

  let { children, class: className = "" }: Props = $props();

  const telescope = getTelescopeContext();

  gsap.registerPlugin(SplitText);

  let node: HTMLSpanElement;
  let visible = $state(!telescope.getOpen());
  let tween: gsap.core.Tween | null = null;
  let split: SplitText | null = null;

  $effect(() => {
    const open = telescope.getOpen();

    if (!node) return;

    if (open) {
      animateOut(node);
    } else {
      tween?.kill();
      split?.revert();
      tween = null;
      split = null;
      visible = true;
    }

    return () => {
      tween?.kill();
      split?.revert();
    };
  });

  function animateOut(node: HTMLElement) {
    if (!visible || tween) return;

    const rect = node.getBoundingClientRect();

    node.style.position = "absolute";
    node.style.width = `${rect.width}px`;
    node.style.pointerEvents = "none";
    node.style.zIndex = "1";

    split = SplitText.create(node, {
      type: "words,chars",
      reduceWhiteSpace: false,
      wordsClass: "inline-block whitespace-nowrap",
      charsClass: "inline-block will-change-[transform,opacity,filter]",
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      split.revert();
      split = null;
      visible = false;
      return;
    }

    tween = gsap.fromTo(
      split.chars,
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
      },
      {
        y: "-0.45em",
        opacity: 0,
        filter: "blur(5px)",
        duration: 0.34,
        ease: "power3.in",
        stagger: 0.006,
        onComplete: () => {
          split?.revert();
          split = null;
          tween = null;
          visible = false;
        },
      },
    );
  }
</script>

{#if visible}
  <span
    bind:this={node}
    class={[
      "inline whitespace-pre-wrap",
      className,
    ].join(" ")}
  >
    {@render children()}
  </span>
{/if}
