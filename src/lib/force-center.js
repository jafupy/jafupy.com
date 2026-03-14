/**
 * Force an item to the center of the viewport, regardless of content below
 * @param {string|HTMLElement} element
 */
export function forceCenter(element) {
  const el =
    typeof element === "string" ? document.querySelector(element) : element;
  const observer = new ResizeObserver(() => {
    const height = el?.clientHeight ?? 0;
    el.style.marginTop = `${(window.innerHeight - height) / 2}px`;
  });
  observer.observe(document.body);

  return observer.disconnect;
}
