export function forceCenter({ centered, below, factor }) {
  const watched = document.querySelector(below);
  const wordmark = document.querySelector(centered);

  function onResize() {
    const wordmarkHeight = wordmark?.getBoundingClientRect().height ?? 0;

    // Center wordmark in viewport, ignoring content
    const margin = (viewportHeight - wordmarkHeight) / 2;

    wordmark && wordmark.setAttribute("style", `margin-top: ${margin}px;`);
  }

  const observer = new ResizeObserver(onResize);
  watched && observer.observe(watched);
  onResize();

  return () => {
    observer.disconnect();
  };
}
