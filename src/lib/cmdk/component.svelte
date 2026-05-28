<script>
  import { onMount, tick } from "svelte";
  import { Portal } from "bits-ui";
  import * as Command from "./command/index.ts";
  import { swapper } from "./swapper.svelte.ts";
  import { engine } from "./search.svelte.ts";
  import { CmdkController } from "./controller.svelte.ts";
  import { SearchIcon, XIcon } from "@lucide/svelte";
  import Result from "./result.svelte";

  const controller = new CmdkController();
  let resultsEl = $state(null);
  let stylesReady = $state(false);

  onMount(() => {
    controller.attach();
    return () => controller.destroy();
  });

  $effect(() => {
    engine.results.length;
    engine.areWeTagging;
    engine.activeFilters.length;
    controller.syncResultsLayout();
  });

  $effect(() => {
    swapper.open;
    controller.setResultsElement(resultsEl);
    return controller.observeResults();
  });

  $effect(() => {
    if (!swapper.open) {
      stylesReady = false;
      return;
    }

    stylesReady = false;
    let cancelled = false;

    tick().then(() => {
      requestAnimationFrame(() => {
        if (!cancelled) stylesReady = true;
      });
    });

    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:window onkeydown={controller.handleGlobalKeydown} />

{#if swapper.open}
  <Command.Root
    results={() => engine.results}
    onConfirm={controller.onConfirm}
    onEscape={controller.close}
  >
    <Portal to="nav">
      <div class="cmdk-shell flex h-full w-full flex-col">
        <div class="flex items-center gap-2.5 px-5 pr-3.5 py-3.5">
          <SearchIcon class="size-4 shrink-0 text-mauve-400" />
          <Command.Input
            value={engine.query}
            onInput={(value) => engine.setQuery(value)}
            class="flex-1 border-0 bg-transparent text-base text-white/80 placeholder:text-mauve-400 focus:outline-none md:text-sm"
            placeholder="Search or type : to filter"
          />
          <button
            onclick={controller.close}
            aria-label="Close search"
            class="h-full aspect-square"
          >
            <XIcon
              class="size-4 text-mauve-400 hover:text-white transition-colors"
            />
          </button>
        </div>
      </div>

      <div
        class="cmdk-chip-row absolute inset-x-4 bottom-0 flex translate-y-3/4 items-center gap-1.5"
      >
        <div class="cmdk-chip-row-inner flex items-center gap-1.5">
          {#if engine.activeFilters.length > 0}
            {#each engine.activeFilters as filter}
              <button
                onclick={() => engine.removeFilter(filter.id)}
                class="flex items-center gap-1 rounded-lg border border-mauve-100/20 bg-mauve-800 px-3 py-1 font-mono text-xs transition-colors hover:border-mauve-100/20"
              >
                {filter.label}
                <XIcon class="size-3" />
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </Portal>

    <Portal to="#content">
      <Command.List>
        <div bind:this={resultsEl} data-cmdk-results class="content-bg">
          <div
            class="flex h-10 items-center justify-between border-b border-mauve-100/20 px-7 font-mono text-xs uppercase tracking-widest text-mauve-400"
          >
            <span>{engine.areWeTagging ? "Filters" : "Results"}</span>
            <span>{engine.results.length}</span>
          </div>

          {#if engine.results.length > 0}
            <div>
              {#each engine.results as result, i (engine.resultKey(result, i))}
                <Command.Item
                  index={i}
                  class="cursor-pointer border-b border-mauve-100/20 transition-colors last:border-b-0"
                >
                  {#snippet children(selected)}
                    <Result
                      {result}
                      {selected}
                      active={stylesReady &&
                        result.type === "filter" &&
                        engine.activeFilters.some(
                          (filter) => filter.id === result.filterId,
                        )}
                    />
                  {/snippet}
                </Command.Item>
              {/each}
              <div class="h-8"></div>
            </div>
          {:else}
            <div class="px-7 py-8">
              <p class="font-serif text-2xl">Nothing here yet</p>
              <p class="mt-2 max-w-lg text-sm leading-relaxed text-mauve-400">
                {engine.areWeTagging
                  ? "Try another filter name, or clear the leading colon to search everything."
                  : "Try a broader query, or type : to filter by year and content type."}
              </p>
            </div>
          {/if}
        </div>
      </Command.List>
    </Portal>
  </Command.Root>
{/if}

<style>
  :global(nav) {
    position: relative;
  }
  :global(nav.searching) {
    padding: 0;
    width: min(
      var(--container-lg),
      calc(min(100vw, var(--spacing-ch-md)) - 4rem)
    );
    position: relative;
    overflow: visible;
    border-radius: var(--radius-xl);
  }
  :global(nav.searching #nav_default) {
    position: absolute;
    inset: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  :global(#content) {
    position: relative;
  }
  :global(#content.searching > [data-page-content]) {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  :global(#content.searching [data-cmdk-results]) {
    position: absolute;
    inset-inline: 0;
    top: 0;
  }
</style>
