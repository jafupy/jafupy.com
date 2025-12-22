<script>
  import { Dialog, Command } from "bits-ui";
  import { Drawer } from "vaul-svelte";
  import {
    Search,
    Clock,
    FileText,
    Home,
    UserRound,
    Moon,
    Sparkles,
    ArrowRight,
  } from "lucide-svelte";

  let open = $state(false);
  let query = $state("");
  let loading = $state(false);
  let results = $state([]);
  let recentSearches = $state([]);
  let isMobile = $state(false);

  // Detect mobile
  $effect(() => {
    if (typeof window !== "undefined") {
      isMobile = window.innerWidth < 640; // sm breakpoint
      const handleResize = () => {
        isMobile = window.innerWidth < 640;
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  });

  // Load recent searches
  $effect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recent-searches");
      if (stored) {
        recentSearches = JSON.parse(stored);
      }
    }
  });

  // Search with debounce
  let searchTimeout;
  $effect(() => {
    if (query.trim() === "") {
      results = [];
      loading = false;
      return;
    }

    loading = true;
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
      try {
        // Replace with your actual search action
        // const data = await actions.search(query);
        // results = data; // Should be array with _type: "ACTION" | "POST" | "LINK"

        // Mock data for demo
        results = [
          {
            _type: "LINK",
            name: "Home",
            path: "/",
            icon: "HomeIcon",
            score: 0.1,
          },
          {
            _type: "POST",
            id: "post-1",
            title: "Getting Started with Astro",
            description: "Learn how to build fast websites with Astro",
            tags: ["astro", "javascript", "web"],
            date: new Date("2024-01-15"),
            score: 0.2,
          },
          {
            _type: "LINK",
            name: "About",
            path: "/about",
            icon: "UserRoundIcon",
            score: 0.3,
          },
          {
            _type: "ACTION",
            id: "toggle-theme",
            title: "Toggle Dark Mode",
            icon: Moon,
            action: "toggle-theme",
            score: 0.4,
          },
        ];
      } catch (error) {
        console.error("Search error:", error);
        results = [];
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

  // Save to recent searches
  function addToRecent(item) {
    if (typeof window === "undefined") return;

    const recent = [
      item,
      ...recentSearches.filter((r) => r.id !== item.id),
    ].slice(0, 5);
    recentSearches = recent;
    localStorage.setItem("recent-searches", JSON.stringify(recent));
  }

  function handleSelect(item) {
    console.log("selected item:", item._type);
    if (item._type === "POST") {
      addToRecent({ id: item.id, title: item.title, type: "writing" });
      const blogPath = `/writing/${new Date(item.date).getFullYear()}/${item.id.replace(".md", "").replace(".mdx", "")}`;
      window.location.href = blogPath;
    } else if (item._type === "LINK") {
      window.location.href = item.path;
    } else if (item._type === "ACTION") {
      item.action();
    }
    open = false;
  }

  function handleOpenChange(newOpen) {
    open = newOpen;
    if (!newOpen) {
      query = "";
      results = [];
      loading = false;
    }
  }

  // Listen for open event
  $effect(() => {
    if (typeof window === "undefined") return;

    const handleOpenSearch = () => {
      open = !open;
    };
    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  });

  // Static actions
  const actions_list = [
    {
      id: "toggle-theme",
      title: "Toggle Dark Mode",
      icon: Moon,
      action: () => {
        console.log("aaa");

        const isDark =
          localStorage.getItem("theme").toString() == "dark" ||
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", !isDark);
        localStorage.setItem("theme", !isDark ? "dark" : "light");
      },
      shortcut: "⌘ D",
      _type: "ACTION",
    },
  ];

  function getIconComponent(iconName) {
    const icons = {
      HomeIcon: Home,
      UserRoundIcon: UserRound,
      FileTextIcon: FileText,
    };
    return icons[iconName] || FileText;
  }
</script>

{#snippet commandContent()}
  <Command.Root shouldFilter={false} class="flex flex-col h-full">
    <!-- Search Input -->
    <div
      class="flex items-center px-5 py-4 border-b border-grey-100/10 shrink-0"
    >
      <Search class="size-5 text-grey-400 mr-3" />
      <Command.Input
        bind:value={query}
        placeholder="Search or type a command..."
        class="flex-1 bg-transparent text-grey-100 placeholder-grey-400 outline-none text-base"
      />
      {#if query}
        <button
          onclick={() => (query = "")}
          class="text-grey-500 hover:text-grey-300 text-xs px-2 py-1 rounded border border-grey-100/10"
        >
          ESC
        </button>
      {/if}
    </div>

    <!-- Results Container -->
    <Command.List class="overflow-y-auto flex-1 px-2 py-3">
      {#if loading}
        <Command.Loading
          class="flex items-center justify-center py-12 text-grey-400 text-sm"
        >
          <div
            class="animate-spin size-5 border-2 border-grey-400 border-t-transparent rounded-full mr-3"
          />
          Searching...
        </Command.Loading>
      {/if}

      {#if !loading && !query}
        <!-- Recent Searches & Actions -->
        <div class="space-y-1 px-1">
          {#if recentSearches.length > 0}
            <Command.Group>
              <div
                class="px-2 py-2 text-xs font-medium text-grey-500 uppercase tracking-wider flex items-center gap-2"
              >
                <Clock class="size-3.5" />
                Recent
              </div>
              {#each recentSearches as recent}
                <Command.Item
                  value={recent.title}
                  onSelect={() => {
                    query = recent.title;
                  }}
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer aria-selected:bg-grey-900/70 hover:bg-grey-900/50 group"
                >
                  <FileText
                    class="size-4 shrink-0 text-grey-500 group-aria-selected:text-old-rose"
                  />
                  <span
                    class="text-sm flex-1 text-grey-300 group-aria-selected:text-grey-100"
                  >
                    {recent.title}
                  </span>
                  <ArrowRight
                    class="size-4 opacity-0 group-hover:opacity-100 text-grey-600"
                  />
                </Command.Item>
              {/each}
            </Command.Group>
          {/if}

          <!-- Actions -->
          <Command.Group>
            <div
              class="px-2 py-2 text-xs font-medium text-grey-500 uppercase tracking-wider flex items-center gap-2"
              class:mt-4={recentSearches.length > 0}
            >
              <Sparkles class="size-3.5" />
              Actions
            </div>
            {#each actions_list as action}
              <Command.Item
                value={action.id}
                onSelect={() =>
                  handleSelect({ _type: action._type, action: action.action })}
                class="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer aria-selected:bg-grey-900/70 hover:bg-grey-900/50 group"
              >
                <div class="flex items-center gap-3">
                  <svelte:component
                    this={action.icon}
                    class="size-4 shrink-0 text-grey-500 group-aria-selected:text-old-rose"
                  />
                  <span
                    class="text-sm text-grey-300 group-aria-selected:text-grey-100"
                  >
                    {action.title}
                  </span>
                </div>
                {#if action.shortcut}
                  <span class="text-xs text-grey-600 font-mono"
                    >{action.shortcut}</span
                  >
                {/if}
              </Command.Item>
            {/each}
          </Command.Group>

          <!-- Empty state suggestion -->
          {#if recentSearches.length === 0}
            <div
              class="flex flex-col items-center justify-center py-8 text-center px-6 mt-4"
            >
              <Search class="size-12 text-grey-700 mb-4" />
              <h3 class="text-grey-300 font-medium mb-2">Quick navigation</h3>
              <p class="text-grey-500 text-sm max-w-xs">
                Search for posts, pages, or use commands to navigate your site
                quickly.
              </p>
            </div>
          {/if}
        </div>
      {/if}

      {#if !loading && query && results.length === 0}
        <Command.Empty
          class="flex flex-col items-center justify-center py-12 text-center px-6"
        >
          <Search class="size-12 text-grey-700 mb-4 opacity-50" />
          <h3 class="text-grey-300 font-medium mb-1">No results found</h3>
          <p class="text-grey-500 text-sm">Try searching for something else</p>
        </Command.Empty>
      {/if}

      {#if query && results.length > 0}
        <!-- Unified Results -->
        <Command.Group>
          <div class="space-y-1 px-1">
            {#each results as result}
              {#if result._type === "LINK"}
                {@const Icon = getIconComponent(result.icon)}
                <Command.Item
                  value={`link-${result.path}`}
                  onSelect={() => handleSelect(result)}
                  class="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer aria-selected:bg-grey-900/70 hover:bg-grey-900/50 group"
                >
                  <Icon
                    class="size-4 shrink-0 mt-0.5 text-grey-500 group-aria-selected:text-old-rose"
                  />
                  <div class="flex-1 min-w-0">
                    <div
                      class="text-sm font-medium text-grey-100 group-aria-selected:text-white"
                    >
                      {result.name}
                    </div>
                    <div
                      class="text-xs mt-0.5 text-grey-500 group-aria-selected:text-grey-400"
                    >
                      {result.path}
                    </div>
                  </div>
                </Command.Item>
              {:else if result._type === "POST"}
                <Command.Item
                  value={`post-${result.id}`}
                  onSelect={() => handleSelect(result)}
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
          </div>
        </Command.Group>
      {/if}
    </Command.List>

    <!-- Footer -->
    <div
      class="border-t border-grey-100/10 px-4 py-2.5 flex items-center justify-between text-xs text-grey-500 shrink-0 bg-grey-950/50"
    >
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1">
          <kbd
            class="px-1.5 py-0.5 bg-grey-900/50 rounded border border-grey-100/10 font-mono text-[10px]"
            >↑↓</kbd
          >
          Navigate
        </span>
        <span class="flex items-center gap-1">
          <kbd
            class="px-1.5 py-0.5 bg-grey-900/50 rounded border border-grey-100/10 font-mono text-[10px]"
            >↵</kbd
          >
          Select
        </span>
      </div>
      <span class="flex items-center gap-1">
        <kbd
          class="px-1.5 py-0.5 bg-grey-900/50 rounded border border-grey-100/10 font-mono text-[10px]"
          >ESC</kbd
        >
        Close
      </span>
    </div>
  </Command.Root>
{/snippet}

<svelte:window onkeydown={handleKeydown} />

{#if isMobile}
  <!-- Mobile: Vaul Drawer -->
  <Drawer.Root bind:open onOpenChange={handleOpenChange}>
    <Drawer.Portal>
      <Drawer.Overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <Drawer.Content
        class="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] flex flex-col bg-grey-950/98 backdrop-blur-xl border-t border-grey-100/20 rounded-t-[38px] shadow-2xl"
      >
        <Drawer.Title class="sr-only">Command Menu</Drawer.Title>

        <!-- Drag handle -->
        <div
          class="w-12 h-1.5 bg-grey-400/30 rounded-full mx-auto mt-4 mb-2 shrink-0"
        ></div>

        {@render commandContent()}
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
{:else}
  <!-- Desktop: Dialog -->
  <Dialog.Root bind:open onOpenChange={handleOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay
        class="fixed inset-0 z-50 backdrop-blur-sm bg-[radial-gradient(transparent_25%,#0f1315cc_25%)] bg-size-[4px_4px]"
      />
      <Dialog.Content
        class="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-[70vh] z-50 flex flex-col bg-grey-950/98 backdrop-blur-xl border border-grey-100/20 rounded-2xl shadow-2xl overflow-hidden"
      >
        <Dialog.Title class="sr-only">Command Menu</Dialog.Title>

        {@render commandContent()}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
