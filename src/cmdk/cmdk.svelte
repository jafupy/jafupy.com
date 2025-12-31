<script>
  import { Command } from "bits-ui";
  import {
    Search,
    Clock,
    FileText,
    House,
    UserRound,
    Moon,
    Sparkles,
    ArrowRight,
    X,
    File,
    Link,
    Newspaper,
  } from "lucide-svelte";
  import { actions } from "astro:actions";
  import identifier from "$/lib/junk";
  import { isCmdkOpen } from "$/lib/stores";

  let query = $state("h");
  let loading = $state(false);
  let results = $state([]);
  let recentSearches = $state([]);

  results = [
    {
      title: "Home",
      aside: "/",

      icon: House,
      action: () => {
        const link = document.createElement("a");
        link.href = "/";
        link.click();
      },
      type: "link",
    },
  ];

  $effect(async () => {
    const { data, error } = await actions.search(query);
    if (error) {
      console.error(error);
    }
    results = [];
    const pages = data.pages?.map((page) => ({
      title: page.item.name,
      aside: page.item.path,
      icon: Link,
      action: () => {
        const link = document.createElement("a");
        link.href = page.item.path;
        link.click();
      },
      type: "link",
      score: page.score,
    }));
    results.push(...pages);
    const posts = data.writing?.map((post) => ({
      title: post.item.title,
      description: post.item.description,
      icon: Newspaper,
      action: () => {
        const link = document.createElement("a");
        link.href = post.item.date.getFullYear + "/" + post.item.path;
        link.click();
      },
      type: "post",
      score: post.score,
    }));
    results.push(...posts);
    results.sort((a, b) => b.score - a.score);
    console.log(pages, posts, data);
  });
</script>

<Command.Root shouldFilter={false} class="flex flex-col h-[300px]">
  <div
    class="flex items-center px-5 py-4 border-b border-grey-100 dark:border-grey-100/10 shrink-0"
  >
    <Search class="size-5 text-grey-400 mr-3" />
    <Command.Input
      bind:value={query}
      placeholder="Search or type a command..."
      class="flex-1 bg-transparent dark:text-grey-100 placeholder-grey-400 outline-none text-base"
    />

    <button
      onclick={() => (query ? (query = "") : isCmdkOpen.set(false))}
      class="text-grey-500 hover:text-grey-700 dark:hover:text-grey-300 text-xs px-2 py-1 rounded-md border border-grey-300 flex items-center"
    >
      <X class="size-4 inline" />
      <span class="hidden sm:inline"> ESC </span>
    </button>
  </div>

  <Command.List class="overflow-y-auto flex-1 px-2 py-3">
    {#if query && results.length < 0}
      <Command.Loading
        class="flex items-center justify-center py-12 text-grey-400 text-sm"
      >
        <div
          class="animate-spin size-5 border-2 border-grey-400 border-t-transparent rounded-full mr-3"
        ></div>

        Searching...
      </Command.Loading>
    {/if}

    <Command.Empty
      class="flex flex-col items-center justify-center py-12 text-center px-6"
    >
      <Search class="size-12 text-grey-700 mb-4 opacity-50" />
      <h3 class="text-grey-300 font-medium mb-1">No results found</h3>
      <p class="text-grey-500 text-sm">Try searching for something else</p>
    </Command.Empty>

    {#if query && results.length > 0}
      <!-- Unified Results -->
      <Command.Group class="flex flex-col gap-2 px-1">
        {#each results as result}
          {#if result.type === "link"}
            {@const Icon = result.icon}
            <Command.Item
              value={`link-${identifier()}`}
              onSelect={result.action}
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer aria-selected:bg-grey-100/70 hover:bg-grey-100/70 dark:aria-selected:bg-grey-900/70 dark:hover:bg-grey-900/50 group"
            >
              <Icon
                class="size-4 text-grey-500 group-aria-selected:text-old-rose"
              />

              <span
                class="text-sm font-medium dark:text-grey-100 dark:group-aria-selected:text-white"
              >
                {result.title}
              </span>
              <span
                class="text-sm text-grey-500 group-aria-selected:text-grey-600 dark:group-aria-selected:text-grey-400"
              >
                {result.aside}
              </span>
            </Command.Item>
          {:else if result.type === "post"}
            <Command.Item
              value={`post-${identifier()}`}
              onSelect={result.action}
              class="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer aria-selected:bg-grey-900/70 hover:bg-grey-900/50 group"
            >
              <FileText
                class="size-4 shrink-0 mt-0.5 text-grey-500 group-aria-selected:text-old-rose"
              />
              <div class="flex-1 min-w-0">
                <div
                  class="text-sm font-medium line-clamp-1 text-grey-100 group-aria-selected:text-white"
                >
                  {result.title}
                </div>
                {#if result.description}
                  <p
                    class="text-xs mt-1 line-clamp-2 text-grey-500 group-aria-selected:text-grey-400"
                  >
                    {result.description}
                  </p>
                {/if}
                {#if result.tags?.length > 0}
                  <div class="flex items-center gap-1.5 mt-2">
                    {#each result.tags.slice(0, 3) as tag}
                      <span
                        class="text-xs px-1.5 py-0.5 rounded border bg-grey-900/50 text-grey-500 border-grey-100/10 group-aria-selected:bg-old-rose/20 group-aria-selected:text-old-rose group-aria-selected:border-old-rose/30"
                      >
                        {tag}
                      </span>
                    {/each}
                    {#if result.tags.length > 3}
                      <span class="text-xs text-grey-600"
                        >+{result.tags.length - 3}</span
                      >
                    {/if}
                  </div>
                {/if}
              </div>
            </Command.Item>
          {:else if result._type === "ACTION"}
            {@const Icon = result.icon}
            <Command.Item
              value={`action-${result.id}`}
              onSelect={() => handleSelect(result)}
              class="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer aria-selected:bg-grey-900/70 hover:bg-grey-900/50 group"
            >
              <div class="flex items-center gap-3">
                <Icon
                  class="size-4 shrink-0 text-grey-500 group-aria-selected:text-old-rose"
                />
                <span
                  class="text-sm text-grey-300 group-aria-selected:text-grey-100"
                >
                  {result.title}
                </span>
              </div>
              {#if result.shortcut}
                <span class="text-xs text-grey-600 font-mono"
                  >{result.shortcut}</span
                >
              {/if}
            </Command.Item>
          {/if}
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Root>
