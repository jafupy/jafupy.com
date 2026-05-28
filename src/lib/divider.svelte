<script lang="ts">
  const { class: className = "" }: { class?: string } = $props();
</script>

<span
  class={`size-1 shrink-0 rounded-full bg-mauve-300 ${className}`}
  aria-hidden="true"></span>
