<script lang="ts">
  import { Portal } from "bits-ui";
  import { controller } from "./index";
  import { gsvap } from "$/lib/gsvap";
</script>

<Portal>
  <ol
    class="fixed bottom-1/6 left-1/2 flex flex-col-reverse -translate-x-1/2 isolate"
  >
    {#each controller.items as item, index}
      <li
        in:gsvap={{
          y: -12,
          filter: "blur(8px)",
        }}
        out:gsvap={{
          opacity: 0,
          y: 12,
          scale: 1.05,
          filter: "blur(8px)",
        }}
        class="rounded-2xl border border-mauve-100/20 bg-mauve-800 px-5 py-3 font-mono text-xs shadow-2xl -mt-8 {[
          '',
          'scale-90 opacity-90 -z-1',
          'scale-75 opacity-75 -z-2',
          'scale-[0] opacity-0',
        ][Math.min(index, 3)]}"
      >
        {item.message}
      </li>
    {/each}
  </ol>
</Portal>
