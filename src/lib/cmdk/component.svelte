<script>
  import { Portal, Command } from "bits-ui";
  import { swapper } from "./swapper.svelte.ts";
  import { engine } from "./search.svelte.ts";
  import { CommandIcon, SearchIcon, XIcon } from "@lucide/svelte";
  import { format } from "../date.ts";
  import Result from "./result.svelte";

  export function onKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      toggle();
    }
    if (e.key === "Escape" && swapper.open) close();
  }

  let scrollPosition = $state(-1);

  async function open() {
    scrollPosition = window.scrollY;
    swapper.toggle(true);
    await engine.init();
    engine.setQuery("");
  }

  function close() {
    swapper.toggle(false);
    engine.reset();
    if (scrollPosition < 0) return;
    window.scrollTo({ top: scrollPosition });
    scrollPosition = -1;
  }

  function toggle() {
    if (swapper.open) close();
    else open();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if swapper.open}
  <Command.Root>
    <Portal to="nav">
      <div class="w-full h-full flex flex-col">
        <div class="flex items-center gap-2.5 px-5 py-3.5">
          <SearchIcon class="size-4 text-mauve-400 shrink-0" />
          <input
            value={engine.query}
            oninput={(e) => engine.setQuery(e.currentTarget.value)}
            class="flex-1 bg-transparent text-base text-white/80 placeholder:text-mauve-400 border-0 focus:outline-none"
            placeholder="Search or type : to filter"
            autofocus
          />
          <kbd
            class="text-xs text-mauve-400 font-mono tracking-wide flex items-center"
          >
            <CommandIcon class="size-3 inline mr-0.5" />K
          </kbd>
        </div>
      </div>
      <!-- {#if engine.activeFilters.length > 0} -->
      <div
        class="absolute inset-x-4 bottom-0 translate-y-3/4 flex items-center gap-1.5 p-0"
      >
        {#each engine.activeFilters as filter}
          <button
            onclick={() => engine.removeFilter(filter.value)}
            class="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-mauve-800 border border-white/10 text-mauve-200 hover:text-mauve-100 hover:border-white/20 transition-colors"
          >
            {filter.value}
            <XIcon class="size-3" />
          </button>
        {/each}
        <button
          class="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-mauve-800 border border-white/10 text-mauve-200 hover:text-mauve-100 hover:border-white/20 transition-colors"
        >
          Testing
          <XIcon class="size-3" />
        </button>
      </div>
      <!-- {/if} -->
    </Portal>

    <Portal to="#content">
      <Command.List
        class="rounded-t-2xl bg-white/5 border-[0.5px] border-white/13 border-b-0 backdrop-blur-xl overflow-y-scroll"
      >
        {#each engine.results as result}
          <Result {engine} {result} />
        {/each}
      </Command.List>
    </Portal>
  </Command.Root>
{/if}

<style>
  :global(nav.searching) {
    padding: 0;
    width: var(--container-lg);
    position: relative;
    overflow: visible;
    border-radius: var(--radius-xl);
  }
  :global(#content.searching) {
    margin-top: 0 !important;
    position: fixed;
    bottom: 0;
    top: 33vh;
    left: 0;
    right: 0;
    overflow-y: scroll;
  }
  :global(body:has(.searching) h1#wordmark) {
    filter: blur(15px) !important;
    opacity: 0.3 !important;
  }
</style>
