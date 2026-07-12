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

  let node = $state<HTMLSpanElement | null>(null);
  let visible = $state(!telescope.getOpen());
  let tween: gsap.core.Tween | null = null;
  let split: TextSplit | null = null;
  let animationVersion = 0;

  $effect(() => {
    const open = telescope.getOpen();
    const version = ++animationVersion;
    const currentNode = node;

    if (open) {
      if (currentNode) animateOut(currentNode, version);
    } else {
      tween?.kill();
      split?.revert();
      tween = null;
      split = null;
      if (currentNode) clearInlineAnimationStyles(currentNode);
      visible = true;
    }

    return () => {
      animationVersion += 1;
      tween?.kill();
      split?.revert();
      if (currentNode) clearInlineAnimationStyles(currentNode);
    };
  });

  function clearInlineAnimationStyles(node: HTMLElement) {
    node.style.position = "";
    node.style.width = "";
    node.style.pointerEvents = "";
    node.style.zIndex = "";
  }

  async function animateOut(node: HTMLElement, version: number) {
    if (!visible || tween || version !== animationVersion) return;

    await tick();
    if (
      !visible ||
      tween ||
      !node.isConnected ||
      version !== animationVersion
    ) return;

    if (prefersReducedMotion()) {
      visible = false;
      return;
    }

    const rect = node.getBoundingClientRect();

    node.style.position = "absolute";
    node.style.width = `${rect.width}px`;
    node.style.pointerEvents = "none";
    node.style.zIndex = "1";

    split = splitOwnText(node);

    if (!split.chars.length) {
      split.revert();
      split = null;
      clearInlineAnimationStyles(node);
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
        y: `-${TELESCOPE_TEXT_MOTION.y}`,
        opacity: 0,
        filter: TELESCOPE_TEXT_MOTION.blur,
        duration: TELESCOPE_TEXT_MOTION.duration,
        ease: TELESCOPE_TEXT_MOTION.easeIn,
        stagger: TELESCOPE_TEXT_MOTION.stagger,
        clearProps: TELESCOPE_TEXT_MOTION.clearProps,
        onComplete: () => {
          if (version !== animationVersion) return;
          split?.revert();
          split = null;
          tween = null;
          clearInlineAnimationStyles(node);
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
