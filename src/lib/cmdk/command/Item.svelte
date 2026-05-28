<script lang="ts">
  import { getContext, onMount, onDestroy, type Snippet } from "svelte";
  import { CMDK_KEY, type CmdkState } from "./index.ts";

  const {
    index,
    children,
    class: cls,
  } = $props<{
    index: number;
    children: Snippet<[boolean]>;
    class?: string;
  }>();

  const state = getContext<CmdkState>(CMDK_KEY);
  let el: HTMLDivElement;

  onMount(() => state.register(index, el));
  onDestroy(() => state.unregister(index));
</script>

<div
  bind:this={el}
  onclick={() => state.confirm(index)}
  class={cls}
  aria-selected={state.selectedIndex === index}
>
  {@render children(state.selectedIndex === index)}
</div>
