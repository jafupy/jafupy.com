<script lang="ts">
  import { getContext } from "svelte";
  import { CMDK_KEY, type CmdkState } from "./index.ts";

  const {
    value,
    onInput,
    class: cls,
    placeholder,
  } = $props<{
    value: string;
    onInput: (value: string) => void;
    class?: string;
    placeholder?: string;
  }>();

  const state = getContext<CmdkState>(CMDK_KEY);
</script>

<input
  {value}
  oninput={(e) => onInput(e.currentTarget.value)}
  onkeydown={state.onkeydown}
  class={cls}
  {placeholder}
  autofocus
/>
