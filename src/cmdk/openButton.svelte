<script>
  import { SearchIcon } from "lucide-svelte";

  function handleClick() {
    // Dispatch custom event to trigger command dialog
    window.dispatchEvent(new CustomEvent("open-search"));
  }
</script>

<button
  class="flex items-center justify-center gap-1.5 hover:text-old-rose transition-colors"
  onclick={handleClick}
>
  <SearchIcon class="size-4" />
  Search
</button>
