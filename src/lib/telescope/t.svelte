<script lang="ts">
  import type { Snippet } from "svelte";
  import { setTelescopeContext } from "./telescope-context.svelte";

  type Props = {
    children: Snippet;
    defaultOpen?: boolean;
    class?: string;
  };

  let {
    children,
    defaultOpen = false,
    class: className = "",
  }: Props = $props();

  let open = $state(defaultOpen);

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
