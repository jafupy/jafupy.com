<script lang="ts">
  import type { Snippet } from "svelte";
  const { children, class: cls } = $props<{
    children: Snippet;
    class?: string;
  }>();
</script>

<div class={cls}>
  {@render children()}
</div>
