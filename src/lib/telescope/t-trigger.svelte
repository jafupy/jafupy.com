<script lang="ts">
  import type { Snippet } from "svelte";
  import { getTelescopeContext } from "./telescope-context.svelte";

  type Props = {
    children: Snippet;
    class?: string;
    title?: string;
  };

  let {
    children,
    class: className = "",
    title = "Expand text",
  }: Props = $props();

  const telescope = getTelescopeContext();

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    telescope.open();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      telescope.open();
    }
  }
</script>

<button
  type="button"
  class={[
    "text-old-rose",
    className,
  ].join(" ")}
  aria-expanded={telescope.getOpen()}
  {title}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {@render children()}
</button>
