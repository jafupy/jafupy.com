<script lang="ts">
  import { untrack } from "svelte";
  import type { Snippet } from "svelte";
  import { setTelescopeContext } from "./telescope-context.svelte";

  type Props = {
    children: Snippet;
    defaultOpen?: boolean;
    class?: string;
  };

  const {
    children,
    defaultOpen = false,
    class: className = "",
  }: Props = $props();

  let open = $state(untrack(() => Boolean(defaultOpen)));

  setTelescopeContext({
    getOpen: () => open,
    open: () => {
      open = true;
    },
    close: () => {
      open = false;
    },
    toggle: () => {
      open = !open;
    },
  });
</script>

<span
  data-telescope-root=""
  class={[
    "inline",
    "group/telescope",
    "transition-colors duration-200",
    className,
  ].join(" ")}
  data-open={open}
>
  {@render children()}
</span>
