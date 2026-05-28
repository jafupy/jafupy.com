<script lang="ts">
  import { SplitText } from "gsap/SplitText.js";
  import type { Snippet } from "svelte";
  import { createGsapAttachment } from "$/lib/util";
  import { getTelescopeContext } from "./telescope-context.svelte";

  type Props = {
    children: Snippet;
    class?: string;
  };

  let { children, class: className = "" }: Props = $props();

  const telescope = getTelescopeContext();

  const revealText = createGsapAttachment((node, _value, { gsap }) => {
    gsap.registerPlugin(SplitText);

    const split = SplitText.create(node, {
      type: "words,chars",
      reduceWhiteSpace: false,
      wordsClass: "inline-block whitespace-nowrap",
      charsClass: "inline-block will-change-[transform,opacity,filter]",
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(split.chars, { clearProps: "all" });
      return () => split.revert();
    }

    const tween = gsap.fromTo(
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

    return () => {
      tween.kill();
      split.revert();
    };
  });
</script>

{#if telescope.getOpen()}
  <span
    {@attach revealText}
    class={[
      "inline whitespace-pre-wrap",
      className,
    ].join(" ")}
  >
    {@render children()}
  </span>
{/if}
