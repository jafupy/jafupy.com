<script lang="ts">
  import {
    CopyIcon,
    FolderIcon,
    Link2Icon,
    NewspaperIcon,
    TagIcon,
    WaypointsIcon,
    type Icon as LucideIcon,
  } from "@lucide/svelte";
  import { format } from "../date";
  import type {
    ActionResult,
    FilterResult,
    PageResult,
    ProjectResult,
    WritingResult,
    SearchResult,
    SocialResult,
  } from "./search.svelte";

  const {
    result,
    selected = false,
    active = false,
  }: {
    result: SearchResult;
    selected?: boolean;
    active?: boolean;
  } = $props();

  const outerClass = $derived(selected ? "-mx-4" : "");
  const innerClass = $derived(
    selected
      ? "rounded-xl border border-mauve-100/20 bg-mauve-800 p-5"
      : result.type === "writing" || result.type === "project"
        ? "px-7 py-5"
        : "px-7 py-4",
  );

  function iconFor(result: SearchResult): typeof LucideIcon {
    switch (result.type) {
      case "writing":
        return NewspaperIcon;
      case "page":
        return Link2Icon;
      case "project":
        return FolderIcon;
      case "action":
        return CopyIcon;
      case "social":
        return WaypointsIcon;
      case "filter":
        return TagIcon;
    }
  }

  const ResultIcon = iconFor(result);

  function capitalise(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
</script>

{#snippet icon()}
  <ResultIcon class="size-4 shrink-0 text-old-rose" />
{/snippet}

{#snippet writingResult(result: WritingResult)}
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <div
        class="mb-3 font-mono text-xs uppercase tracking-widest text-mauve-400"
      >
        writing
      </div>
      <p class="font-serif text-xl leading-tight">
        {result.title}
      </p>
    </div>
    <div class="flex items-center gap-3">
      <span class="mt-1 shrink-0 font-mono text-xs text-mauve-400">
        {format(new Date(result.date))}
      </span>
      {@render icon()}
    </div>
  </div>
  {#if result.description}
    <p class="mt-3 text-sm leading-relaxed text-mauve-400">
      {result.description}
    </p>
  {/if}
{/snippet}

{#snippet pageResult(result: PageResult)}
  <div class="flex items-center justify-between gap-4">
    <div class="min-w-0">
      <div
        class="mb-1 font-mono text-xs uppercase tracking-widest text-mauve-400"
      >
        Page
      </div>
      <p class="truncate font-serif transition-colors">
        {result.title}
      </p>
    </div>
    {@render icon()}
  </div>
{/snippet}

{#snippet projectResult(result: ProjectResult)}
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <div
        class="mb-3 font-mono text-xs uppercase tracking-widest text-mauve-400"
      >
        project
      </div>
      <p class="font-serif text-xl leading-tight">
        {result.title}
      </p>
      {#if result.description}
        <p class="mt-3 text-sm leading-relaxed text-mauve-400">
          {result.description}
        </p>
      {/if}
    </div>
    {@render icon()}
  </div>
{/snippet}

{#snippet actionResult(result: ActionResult)}
  <div class="flex items-center justify-between gap-4">
    <div class="min-w-0">
      <div
        class="mb-1 font-mono text-xs uppercase tracking-widest text-mauve-400"
      >
        Action
      </div>
      <p class="truncate font-serif transition-colors">
        {result.title}
      </p>
      {#if selected}
        <p class="mt-3 text-sm leading-relaxed text-mauve-400">
          {result.description}
        </p>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet socialResult(result: SocialResult)}
  <div class="flex items-center justify-between gap-4">
    <div class="min-w-0">
      <div
        class="mb-1 font-mono text-xs uppercase tracking-widest text-mauve-400"
      >
        Social
      </div>
      <p class="truncate font-serif transition-colors">
        {result.title}
      </p>
    </div>
    {@render icon()}
  </div>
{/snippet}

{#snippet filterResult(result: FilterResult)}
  <div class="flex items-center justify-between gap-4">
    <div class="min-w-0">
      <div
        class="mb-1 font-mono text-xs uppercase tracking-widest text-mauve-400"
      >
        {active ? "Remove Filter" : "Filter"}
      </div>
      <p
        class="truncate font-serif transition-colors {active
          ? 'text-old-rose'
          : ''}"
      >
        {#if active}
          <span>- </span><span class="line-through">{result.title}</span>
        {:else}
          {result.title}
        {/if}
      </p>
      {#if selected}
        <p class="mt-3 text-sm leading-relaxed text-mauve-400">
          {capitalise(result.filterType)}
        </p>
      {/if}
    </div>
    {@render icon()}
  </div>
{/snippet}

<div class={outerClass}>
  <div class={innerClass}>
    {#if result.type === "writing"}
      {@render writingResult(result)}
    {:else if result.type === "project"}
      {@render projectResult(result)}
    {:else if result.type === "page"}
      {@render pageResult(result)}
    {:else if result.type === "action"}
      {@render actionResult(result)}
    {:else if result.type === "social"}
      {@render socialResult(result)}
    {:else}
      {@render filterResult(result)}
    {/if}
  </div>
</div>
