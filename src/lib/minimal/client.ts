import "$/lib/dither";
import { gsap } from "gsap";
import { clamp } from "$/lib/utils/clamp";

const WORDMARK_SCROLL_END = 200;
const WORDMARK_FADE_MAX = 0.8;
const CMDK_MOTION_DURATION = 0.15;
const CONTENT_WORDMARK_OVERLAP = 48;

export function setupMinimalLayout() {
  const wordmark = document.querySelector<HTMLHeadingElement>("h1#wordmark")!;
  const fade = document.querySelector<HTMLDivElement>("div#fade")!;
  const content = document.querySelector<HTMLDivElement>("div#content")!;
  const cmdkTrigger = document.querySelector<HTMLButtonElement>(
    "button#cmdk_trigger",
  );

  let cmdkOpen = false;
  let lastWidth = window.innerWidth;
  let frame = 0;
  let layoutId = 0;

  const timeline = gsap
    .timeline({ paused: true })
    .fromTo(fade, { opacity: 0 }, { opacity: WORDMARK_FADE_MAX, ease: "none" })
    .to(wordmark, { filter: "blur(8px)", ease: "none", duration: 0.5 }, "<");

  function progress() {
    return clamp(window.scrollY / WORDMARK_SCROLL_END, 0, 1);
  }

  function sync() {
    timeline.progress(cmdkOpen ? 1 : progress());
  }

  function tweenTo(progress: number) {
    gsap.killTweensOf(timeline);
    gsap.to(timeline, {
      duration: CMDK_MOTION_DURATION,
      ease: "power2.out",
      progress,
      overwrite: "auto",
    });
  }

  async function layout() {
    const id = ++layoutId;

    const root = getComputedStyle(document.documentElement);
    const rootSize = Number.parseFloat(root.fontSize);

    const sm = cssLengthToPx(
      root.getPropertyValue("--breakpoint-sm").trim(),
      40,
      rootSize,
    );

    const md = cssLengthToPx(
      root.getPropertyValue("--breakpoint-md").trim(),
      48,
      rootSize,
    );

    wordmark.style.top = `${wordmarkTop(sm, md)}px`;

    await document.fonts.ready;
    if (id !== layoutId) return;

    const maxWidth = wordmarkMaxWidth(rootSize);

    wordmark.style.maxWidth = `${maxWidth}px`;
    wordmark.style.whiteSpace = "normal";

    // Find the largest font size that fits within the available width and line count.
    let best = 8;
    let lo = best;
    let hi = 2000;
    const maxLines = wordmark.innerText.length > 15 ? 2 : 1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      wordmark.style.fontSize = `${mid}px`;

      const style = getComputedStyle(wordmark);
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight =
        style.lineHeight === "normal"
          ? fontSize * 1.2 // Browser default-ish line-height estimate.
          : Number.parseFloat(style.lineHeight);

      if (
        Math.round(wordmark.scrollHeight / lineHeight) > maxLines ||
        wordmark.scrollWidth > maxWidth
      ) {
        hi = mid - 1;
      } else {
        best = mid;
        lo = mid + 1;
      }
    }

    wordmark.style.fontSize = `${best}px`;

    const contentTop =
      wordmark.getBoundingClientRect().bottom - CONTENT_WORDMARK_OVERLAP;

    content.style.marginTop = `${contentTop}px`;
    content.style.setProperty("--content-resting-offset", `${contentTop}px`);

    sync();
  }

  function cssLengthToPx(value: string, fallback: number, rootSize: number) {
    if (value.endsWith("px")) return Number.parseFloat(value);

    const parsed = Number.parseFloat(value);
    return (Number.isNaN(parsed) ? fallback : parsed) * rootSize;
  }

  function wordmarkTop(sm: number, md: number) {
    const mobileTop = window.innerHeight / 3;
    const desktopTop = window.innerHeight / 2;

    if (window.innerWidth <= sm) return mobileTop;
    if (window.innerWidth >= md) return desktopTop;
    if (sm === md) return desktopTop;

    const t = (window.innerWidth - sm) / (md - sm);
    return mobileTop + (desktopTop - mobileTop) * t;
  }

  function wordmarkMaxWidth(rootSize: number) {
    const paddingRem =
      window.innerWidth > content.clientWidth + 64
        ? 8
        : (window.innerWidth - content.clientWidth) / 2 / rootSize + 1.5;

    return window.innerWidth - paddingRem * rootSize * 2;
  }

  window.addEventListener("cmdk-opened", () => {
    cmdkOpen = true;
    tweenTo(1);
  });

  window.addEventListener("cmdk-closed", () => {
    cmdkOpen = false;
    tweenTo(progress());
  });

  window.addEventListener(
    "scroll",
    () => {
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!cmdkOpen) sync();
      });
    },
    { passive: true },
  );

  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;

    lastWidth = window.innerWidth;
    layout();
  });

  if (cmdkTrigger) {
    cmdkTrigger.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("cmdk-toggle"));
    });
  }

  layout();
}
