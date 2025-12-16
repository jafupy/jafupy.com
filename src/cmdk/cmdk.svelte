<script>
  import { onMount } from "svelte";
  import { Dialog, Command } from "bits-ui";
  import {
    Search,
    FileText,
    Tag,
    Command as CommandIcon,
    House,
    UserRound,
  } from "lucide-svelte";
  import { actions } from "astro:actions";

  let open = $state(false);
  let query = $state("");
  let loading = $state(false);
  let results = $state({ writing: [], pages: [] });
  let searchTimeout;

  // Debounced search
  $effect(() => {
    if (query.trim() === "") {
      results = { writing: [], pages: [] };
      loading = false;
      return;
    }

    loading = true;
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
      try {
        // Use your Astro actions here
        const { data } = await actions.search(query);
        results = data || { writing: [], pages: [] };

        // Or if using fetch instead:
        // const response = await fetch('/api/search', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ query })
        // });
        // const searchData = await response.json();
        // results = searchData || { writing: [], pages: [] };
      } catch (error) {
        console.error("Search error:", error);
        results = { writing: [], pages: [] };
      } finally {
        loading = false;
      }
    }, 300);
  });

  // Keyboard shortcuts
  function handleKeydown(e) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open = !open;
    }
  }

  function handleSelect(item) {
    if (item.writing) {
      const blogPath = `/w/${new Date(item.writing.date).getFullYear()}/${item.writing.id.replace(".md", "").replace(".mdx", "")}`;
      window.location.href = blogPath;
    } else if (item.page) {
      window.location.href = item.page.path;
    }
    open = false;
  }

  function handleOpenChange(newOpen) {
    open = newOpen;
    if (!newOpen) {
      query = "";
      results = { writing: [], pages: [] };
      loading = false;
    }
  }

  onMount(() => {
    const handleOpenSearch = () => {
      open = !open;
    };

    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  });

  function getIconComponent(iconName) {
    const icons = {
      HouseIcon: House,
      UserRoundIcon: UserRound,
      FileTextIcon: FileText,
    };
    return icons[iconName] || FileText;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 backdrop-blur-sm bg-[radial-gradient(transparent_25%,#0f1315cc_25%)] bg-size-[4px_4px]"
    />
    <Dialog.Content
      class="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
    >
      <Dialog.Title class="sr-only">Search Menu</Dialog.Title>

      <Command.Root
        shouldFilter={false}
        class="mx-auto bg-grey-950/95 backdrop-blur-md border border-grey-100/20 rounded-xl shadow-2xl overflow-hidden"
      >
        <div class="flex items-center px-4 border-b border-grey-100/10">
          <Search class="size-4 text-grey-400 mr-3" />
          <Command.Input
            bind:value={query}
            placeholder="Search..."
            class="flex-1 bg-transparent py-4 text-grey-100 placeholder-grey-400 outline-none text-sm"
          />
        </div>

        <Command.List class="max-h-80 overflow-y-auto p-2">
          {#if loading}
            <Command.Loading
              class="flex items-center justify-center py-8 text-grey-400 text-sm"
            >
              <div
                class="animate-spin size-4 border border-grey-400 border-t-transparent rounded-full mr-2"
              ></div>
              Searching...
            </Command.Loading>
          {/if}

          {#if !loading && query && results.writing.length === 0 && results.pages.length === 0}
            <Command.Empty
              class="flex flex-col items-center justify-center py-8 text-grey-400"
            >
              <Search class="size-8 mb-2 opacity-50" />
              <p class="text-sm">No results found for "{query}"</p>
            </Command.Empty>
          {/if}

          {#if !loading && query === ""}
            <div
              class="h-[150px] flex flex-col items-center justify-center gap-3 p-3 rounded-lg text-grey-300"
            >
              <Search />
              Start searching...
            </div>
          {/if}

          {#if results.pages.length > 0 && query}
            <Command.Group>
              <Command.GroupHeading class="text-lg font-semibold my-2 ml-2">
                Pages
              </Command.GroupHeading>

              {#each results.pages as result}
                {@const Icon = getIconComponent(result.item.icon)}
                <Command.Item
                  value={result.item.path}
                  onSelect={() => handleSelect({ page: result.item })}
                  class="flex items-start justify-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-grey-900/50 aria-selected:bg-grey-900/70 group"
                >
                  <Icon
                    class="size-4 text-grey-400 mt-0.5 shrink-0 group-aria-selected:text-old-rose"
                  />
                  <div class="flex-1 min-w-0 flex">
                    <h3
                      class="font-medium text-grey-100 text-sm line-clamp-1 group-aria-selected:text-white"
                    >
                      {result.item.name}
                    </h3>
                    <span class="text-sm text-grey-300 ml-auto">
                      {#each result.item.path
                        .split("/")
                        .filter((p) => p) as part, index}
                        {part}
                        {#if index < result.item.path
                            .split("/")
                            .filter((p) => p).length - 1}
                          <span class="text-xs text-grey-500">/</span>
                        {/if}
                      {/each}
                    </span>
                  </div>
                </Command.Item>
              {/each}
            </Command.Group>
          {/if}

          {#if results.writing.length > 0 && query}
            <Command.Group>
              <Command.GroupHeading class="text-lg font-semibold my-2 ml-2">
                Writing
              </Command.GroupHeading>

              {#each results.writing as result}
                <Command.Item
                  value={result.item.id}
                  onSelect={() => handleSelect({ writing: result.item })}
                  class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 hover:bg-grey-900/50 aria-selected:bg-grey-900/70 group"
                >
                  <FileText
                    class="size-4 text-grey-400 mt-0.5 shrink-0 group-aria-selected:text-old-rose"
                  />
                  <div class="flex-1 min-w-0">
                    <h3
                      class="font-medium text-grey-100 text-sm line-clamp-1 group-aria-selected:text-white"
                    >
                      {result.item.title}
                    </h3>
                    {#if result.item.description}
                      <p
                        class="text-xs text-grey-400 mt-1 line-clamp-2 group-aria-selected:text-grey-300"
                      >
                        {result.item.description}
                      </p>
                    {/if}
                    {#if result.item.tags?.length > 0}
                      <div
                        class="flex items-center justify-start gap-1 mt-2 flex-wrap"
                      >
                        <Tag class="size-3 text-grey-500" />
                        {#each result.item.tags.slice(0, 4) as tag}
                          <span
                            class="text-xs capitalize px-1.5 py-0.5 bg-grey-900/50 text-grey-400 rounded border border-grey-100/10 group-aria-selected:bg-old-rose/20 group-aria-selected:text-old-rose group-aria-selected:border-old-rose/30"
                          >
                            {tag}
                          </span>
                        {/each}
                        {#if result.item.tags.length > 4}
                          <span class="text-xs text-grey-500">
                            +{result.item.tags.length - 4}
                          </span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </Command.Item>
              {/each}
            </Command.Group>
          {/if}
        </Command.List>
      </Command.Root>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
