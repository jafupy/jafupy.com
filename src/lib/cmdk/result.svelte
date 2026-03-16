<script>
  import { Command } from "bits-ui";
  import { format } from "../date";
  const { result, engine } = $props();
</script>

<Command.Item
  value={result.title}
  onSelect={() => {
    if (engine.areWeTagging) {
      engine.confirmFilter(result.title);
    } else if (result.action) {
      result.action();
      close();
    } else if (result.href) {
      window.location.href = result.href;
    }
  }}
  class="px-7 cursor-pointer hover:bg-white/3 transition-colors {result.type ===
  'post'
    ? 'py-5'
    : 'py-3'}"
>
  {#if result.type === "post"}
    <div class="flex items-start justify-between gap-4">
      <p class="font-serif text-xl">{result.title}</p>
      {#if result.date}
        <span class="text-sm text-white/40 shrink-0 mt-1"
          >{format(new Date(result.date))}</span
        >
      {/if}
    </div>
    {#if result.description}
      <p class="text-sm text-white/50 mt-1.5">{result.description}</p>
    {/if}
  {:else}
    <div class="flex items-center justify-between gap-4">
      <p class="">{result.title}</p>
      {#if result.description}
        <span class="text-xs text-mauve-400 shrink-0">{result.description}</span
        >
      {/if}
    </div>
  {/if}
</Command.Item>
