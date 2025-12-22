<script>
  import { Drawer } from "vaul-svelte";
  import { Menu, X, Search, SquareArrowOutUpRight } from "lucide-svelte";

  import Cmdk from "$/cmdk/cmdk.svelte";

  let open = $state(false);
</script>

<Drawer.Root
  shouldScaleBackground={true}
  closeThreshold={0.8}
  direction="bottom"
  bind:open
>
  <Drawer.Trigger class="md:hidden">
    {#if open}
      <X class="size-4" />
    {:else}
      <Menu class="size-4" />
    {/if}
  </Drawer.Trigger>

  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-40 bg-blue-100/20" />
    <Drawer.Content
      class="fixed inset-x-0 bottom-0! z-50 flex flex-col text-grey-100 hover:text-white transition-colors font-medium bg-grey-950 border-t border-grey-100/20 rounded-t-[2.375rem] outline-none"
    >
      <div
        class="mx-auto w-12 h-1.5 bg-grey-400/30 rounded-full mt-4 shrink-0"
      ></div>

      <div class="flex flex-col gap-1 p-6 pb-8 overflow-y-auto">
        <Drawer.Title class="sr-only">Navigation Menu</Drawer.Title>

        <a
          href="/"
          class="py-3 px-2 rounded-lg hover:bg-grey-900/50"
          onclick={() => (open = false)}
        >
          Home
        </a>

        <a
          href="/about"
          class="py-3 px-2 rounded-lg hover:bg-grey-900/50"
          onclick={() => (open = false)}
        >
          About
        </a>

        <a
          href="/writing"
          class="py-3 px-2 rounded-lg hover:bg-grey-900/50"
          onclick={() => (open = false)}
        >
          Writing
        </a>

        <a
          href="mailto:hello@jafupy.com"
          class="py-3 px-2 rounded-lg hover:bg-grey-900/50 flex gap-1 items-center"
          onclick={() => (open = false)}
        >
          Contact
          <SquareArrowOutUpRight class="size-4" />
        </a>

        <div class="border-t border-grey-100/10 my-2"></div>

        <button
          class="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-grey-900/50"
          onclick={() => {
            open = false;
            window.dispatchEvent(new Event("open-search"));
          }}
        >
          <Search class="size-4" />
          Search
        </button>

        <Drawer.NestedRoot bind:open>
          <Drawer.Portal>
            <Drawer.Overlay class="bg-black/50"></Drawer.Overlay>
            <Drawer.Content
              class="fixed bottom-0 left-0 right-0 z-51 max-h-[85vh] flex flex-col bg-white/80 dark:bg-grey-950/80 backdrop-blur-xl border-t border-grey-100/20 rounded-t-[38px] shadow-2xl"
            >
              <Drawer.Title class="sr-only">Command Menu</Drawer.Title>
              <div
                class="w-12 h-1.5 bg-grey-400/30 rounded-full mx-auto mt-4 mb-2 shrink-0"
              >
                <!-- Drag Handle -->
              </div>
              <Cmdk />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.NestedRoot>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
