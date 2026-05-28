<script lang="ts">
  import { setContext, type Snippet } from "svelte";
  import { CmdkState } from "./state.svelte.ts";
  import { CMDK_KEY } from "./index.ts";
  import type { SearchResult } from "../search.svelte.ts";

  const { onConfirm, onEscape, results, children } = $props<{
    results: () => SearchResult[];
    onConfirm: (result: SearchResult) => void;
    onEscape: () => void;
    children: Snippet;
  }>();

  const state = new CmdkState({ results, onConfirm, onEscape });
  setContext(CMDK_KEY, state);
</script>

{@render children()}
