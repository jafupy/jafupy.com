<script lang="ts">
  import { useDebounce } from "runed";
  import { onMount } from "svelte";
  import { fade, fly, scale } from "svelte/transition";

  interface Heading {
    id: string;
    text: string;
    level: number;
    element: HTMLElement;
  }

  let headings = $state<Heading[]>([]);
  let scrollY = $state(0);
  let innerHeight = $state(0);
  let toc = $state<HTMLElement | null>(null);

  const scrollPos = $derived({
    min: scrollY,
    ideal: Math.round(scrollY + (1 / 3) * innerHeight),
    max: scrollY + innerHeight,
  });

  const rankedHeadings = $derived.by(() => {
    return headings
      .map((heading) => ({
        ...heading,
        offset: heading.element.getBoundingClientRect().top + scrollY,
      }))
      .filter((heading) => heading.offset <= scrollPos.ideal)
      .sort((a, b) => b.offset - a.offset);
  });

  const currentHeading = $derived(rankedHeadings[0] || headings[0]);

  $effect(() => {
    toc
      ?.querySelector(`#${currentHeading?.id}`)
      ?.scrollIntoView({ behavior: "smooth" });
  });

  const sizes = ["w-5", "w-4", "w-3", "w-2"];

  onMount(() => {
    // Initialize headings after component mounts
    const content = document.querySelector("article");
    const headingElements = Array.from(
      content?.querySelectorAll("h1, h2, h3, h4, h5, h6") ?? [],
    ) as HTMLElement[];

    if (headingElements.length <= 1) {
      return;
    }

    headings = headingElements.map((element) => ({
      id: element.id,
      text: element.textContent?.trim() || "",
      level: parseInt(element.tagName.slice(1)) - 1,
      element,
    }));

    // Set initial values
    scrollY = window.scrollY;
    innerHeight = window.innerHeight;

    // Handle scroll
    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    // Handle resize
    const handleResize = () => {
      innerHeight = window.innerHeight;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  });

  let hoverStates = $state({
    ToC: false,
    Lines: false,
    Backdrop: false,
  });

  let isHovered = $derived(
    hoverStates.ToC || hoverStates.Lines || hoverStates.Backdrop,
  );
</script>

{#if isHovered}
  <nav
    onmouseenter={() => {
      hoverStates.ToC = true;
    }}
    onmouseleave={() => {
      hoverStates.ToC = false;
    }}
    transition:fly={{ duration: 150, x: 250 }}
    id="toc"
    class="fixed z-20 top-1/2 right-8 -translate-y-1/2 max-h-[60vh] max-w-[20ch] text-right overflow-scroll flex flex-col w-full gap-2.5 items-end bg-white/80 p-4 rounded-xl border border-grey-300 dark:border-grey-100/20"
    style={"scrollbar-width: none; -ms-overflow-style: none; &::-webkit-scrollbar { display: none; }"}
  >
    {#each headings as { id, text }}
      <a href={`#${id}`} class="text-sm py-2">{text}</a>
    {/each}
  </nav>
{/if}
{#if !isHovered}
  <div
    onmouseenter={() => {
      hoverStates.Lines = true;
    }}
    onmouseleave={() => {
      hoverStates.Lines = false;
    }}
    transition:fly={{ duration: 150, x: 250 }}
    role="presentation"
    class="fixed z-3 isolate top-1/2 right-8 -translate-y-1/2 max-h-[60vh] max-w-[20ch] overflow-scroll flex flex-col gap-2.5 items-end"
  >
    {#each headings as { id, level }}
      <span
        {id}
        class="h-0.5 rounded-full transition-all not-dark:shadow-md {sizes[
          level
        ]} {currentHeading?.id === id ? 'bg-black' : 'bg-grey-300'}"
      ></span>
    {/each}
  </div>
{/if}
<div
  onmouseenter={() => {
    hoverStates.Backdrop = true;
  }}
  onmouseleave={() => {
    hoverStates.Backdrop = false;
  }}
  aria-hidden="true"
  class="fixed top-1/2 right-0 w-15 py-10 -translate-y-1/2 max-h-[60vh] max-w-[20ch] overflow-scroll flex flex-col gap-2.5 items-end"
>
  {#each headings}
    <span class="h-0.5"></span>
  {/each}
</div>
