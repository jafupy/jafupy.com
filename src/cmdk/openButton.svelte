<script>
  import { SearchIcon } from "lucide-svelte";
  import Cmdk from "./cmdk.svelte";
  import { Dialog } from "bits-ui";

  function handleClick() {
    // Dispatch custom event to trigger command dialog
    open = true;
  }

  let open = $state(false);
</script>

<button
  class="hidden sm:flex items-center justify-center gap-1.5 hover:text-old-rose transition-colors"
  onclick={handleClick}
>
  <SearchIcon class="size-4" />
  Search
</button>

<!-- <svelte:window onkeydown={handleKeyDown} /> -->

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-[radial-gradient(transparent_25%,#0f1315cc_25%)] bg-size-[4px_4px]"
    ></Dialog.Overlay>
    <Dialog.Content
      class="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-[70vh] z-50 flex flex-col bg-white/80 dark:bg-grey-950/80 backdrop-blur-xl border border-grey-100/20 rounded-2xl shadow-2xl overflow-hidden"
    >
      <Dialog.Title class="sr-only">Command Menu</Dialog.Title>

      <Cmdk />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
