import { gsap } from "gsap";
import { Flip } from "gsap/all";
import { swapper } from "./swapper.svelte.ts";

gsap.registerPlugin(Flip);

type FlipState = ReturnType<typeof Flip.getState>;

const NAV_SELECTOR = "nav";
const CONTENT_SELECTOR = "#content";
const NAV_DEFAULT_SELECTOR = "#nav_default";
const SEARCHING_CONTENT_SELECTOR = "#content.searching";
const SELECTED_ITEM_SELECTOR = '#content.searching [aria-selected="true"]';
const ANIMATION_DURATION = 0.2;
const ITEM_STAGGER = 0.03;
const RESULT_STAGGER = 0.025;
const BLUR_AMOUNT = "blur(10px)";

export class CmdkAnimator {
  #resultsEl: HTMLElement | null = null;
  #cleanupViewportObservers: (() => void) | null = null;
  #syncOffsetFrame = 0;
  #lastSyncedMarginTop: number | null = null;
  #navEl: HTMLElement | null = null;
  #navDefaultEl: HTMLElement | null = null;
  #contentEl: HTMLElement | null = null;

  setResultsElement(el: HTMLElement | null) {
    this.#resultsEl = el;
  }

  captureLayout() {
    const nav = this.#nav();
    const content = this.#content();
    if (!nav || !content) return null;
    return Flip.getState([nav, content]);
  }

  playOpen(layoutState: FlipState | null) {
    const nav = this.#nav();
    const navDefault = this.#navDefault();
    const children = this.#defaultNavChildren();
    const shell = this.#searchShell();
    const targets = this.#searchUiTargets();
    if (!nav) return Promise.resolve();

    gsap.killTweensOf(nav);
    if (navDefault) {
      gsap.set(navDefault, {
        opacity: 1,
        visibility: "visible",
      });
    }

    if (shell) {
      gsap.set(shell, {
        opacity: 0,
        y: 10,
        filter: BLUR_AMOUNT,
      });
    }

    if (targets.length > 0) {
      gsap.set(targets, {
        opacity: 0,
        y: 10,
      });
    }

    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        defaults: {
          duration: ANIMATION_DURATION,
          ease: "power2.out",
          overwrite: "auto",
        },
        onComplete: () => resolve(),
      });

      if (children.length > 0) {
        tl.to(
          children,
          {
            opacity: 0,
            y: -10,
            filter: BLUR_AMOUNT,
            stagger: {
              each: ITEM_STAGGER,
              from: "start",
            },
          },
          0,
        );
      }

      if (layoutState) {
        tl.add(
          Flip.from(layoutState, {
            duration: ANIMATION_DURATION,
            ease: "power2.inOut",
            absolute: true,
            nested: true,
          }),
          0,
        );
      }

      if (shell) {
        tl.to(
          shell,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            clearProps: "opacity,transform,filter",
          },
          0.02,
        );
      }

      if (targets.length > 0) {
        tl.to(
          targets,
          {
            opacity: 1,
            y: 0,
            stagger: ITEM_STAGGER,
            clearProps: "opacity,transform",
          },
          0.04,
        );
      }

      if (navDefault) {
        tl.set(navDefault, {
          opacity: 0,
          visibility: "hidden",
        });
      }
    });
  }

  playClose() {
    const nav = this.#nav();
    const content = this.#content();
    const navDefault = this.#navDefault();
    const children = this.#defaultNavChildren();
    const shell = this.#searchShell();
    const targets = this.#searchUiTargets();
    if (!nav || !content || !navDefault) return Promise.resolve();

    const navTargetWidth = navDefault.getBoundingClientRect().width + 24;
    const navCurrentWidth = nav.getBoundingClientRect().width;
    const restingOffset = this.#restingOffset(content);

    nav.style.width = `${navCurrentWidth}px`;
    gsap.set(navDefault, {
      opacity: 1,
      visibility: "visible",
    });
    if (children.length > 0) {
      gsap.set(children, {
        visibility: "visible",
        opacity: 0,
        y: 10,
        filter: BLUR_AMOUNT,
      });
    }

    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        defaults: {
          duration: ANIMATION_DURATION,
          ease: "power2.out",
          overwrite: "auto",
        },
        onComplete: () => {
          if (navDefault) {
            gsap.set(navDefault, {
              clearProps: "opacity,visibility",
            });
          }
          resolve();
        },
      });

      if (shell) {
        tl.to(
          shell,
          {
            opacity: 0,
            y: -10,
            filter: BLUR_AMOUNT,
          },
          0,
        );
      }

      if (targets.length > 0) {
        tl.to(
          targets,
          {
            opacity: 0,
            y: -10,
            stagger: RESULT_STAGGER,
          },
          0,
        );
      }

      tl.call(
        () => {
          swapper.toggle(false);
        },
        undefined,
        ANIMATION_DURATION,
      );

      tl.to(
        nav,
        {
          width: navTargetWidth,
          clearProps: "width",
        },
        ANIMATION_DURATION,
      );

      tl.to(
        content,
        {
          marginTop: restingOffset,
          ease: "power3.out",
        },
        ANIMATION_DURATION,
      );

      if (children.length > 0) {
        tl.to(
          children,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            stagger: ITEM_STAGGER,
            clearProps: "visibility,opacity,transform,filter",
          },
          ANIMATION_DURATION,
        );
      }
    });
  }

  syncOffset() {
    this.#syncOffsetFrame = 0;

    const content = this.#searchingContent();
    const nav = this.#searchingNav();
    const panelHeight = this.#resultsEl?.offsetHeight ?? 0;

    if (!content || !nav) return;

    const pageTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const viewportBottom = pageTop + viewportHeight;
    const navBottom = window.scrollY + nav.getBoundingClientRect().bottom;
    const minTop = Math.max(pageTop + viewportHeight * 0.4, navBottom + 24);
    const marginTop = Math.max(minTop, viewportBottom - panelHeight);

    if (
      this.#lastSyncedMarginTop !== null &&
      Math.abs(this.#lastSyncedMarginTop - marginTop) < 1
    ) {
      return;
    }

    this.#lastSyncedMarginTop = marginTop;

    gsap.to(content, {
      marginTop,
      duration: ANIMATION_DURATION,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  scheduleSyncOffset() {
    if (this.#syncOffsetFrame) return;

    this.#syncOffsetFrame = requestAnimationFrame(() => this.syncOffset());
  }

  resetOffset() {
    const content = this.#content();

    if (!content) return Promise.resolve();

    const restingOffset = this.#restingOffset(content);

    return gsap.to(content, {
      marginTop: restingOffset,
      duration: ANIMATION_DURATION,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  centerSelectedResult() {
    const selected = document.querySelector<HTMLElement>(
      SELECTED_ITEM_SELECTOR,
    );

    selected?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }

  startObservingResults() {
    this.stopObservingResults();

    const onViewportChange = () => this.scheduleSyncOffset();
    window.addEventListener("resize", onViewportChange);

    this.#cleanupViewportObservers = () => {
      window.removeEventListener("resize", onViewportChange);
    };

    return () => this.stopObservingResults();
  }

  stopObservingResults() {
    if (this.#syncOffsetFrame) {
      cancelAnimationFrame(this.#syncOffsetFrame);
      this.#syncOffsetFrame = 0;
    }

    this.#lastSyncedMarginTop = null;
    this.#cleanupViewportObservers?.();
    this.#cleanupViewportObservers = null;
  }

  #nav() {
    if (this.#navEl?.isConnected) return this.#navEl;
    this.#navEl = document.querySelector<HTMLElement>(NAV_SELECTOR);
    return this.#navEl;
  }

  #navDefault() {
    if (this.#navDefaultEl?.isConnected) return this.#navDefaultEl;
    this.#navDefaultEl =
      document.querySelector<HTMLElement>(NAV_DEFAULT_SELECTOR);
    return this.#navDefaultEl;
  }

  #defaultNavChildren() {
    return Array.from(this.#navDefault()?.children ?? []) as HTMLElement[];
  }

  #searchShell() {
    return this.#nav()?.querySelector<HTMLElement>(".cmdk-shell") ?? null;
  }

  #searchUiTargets() {
    const chips =
      this.#nav()?.querySelector<HTMLElement>(".cmdk-chip-row-inner") ?? null;
    const panelChildren = this.#resultsEl
      ? Array.from(this.#resultsEl.children)
      : [];

    return [chips, ...panelChildren].filter(Boolean) as HTMLElement[];
  }

  #content() {
    if (this.#contentEl?.isConnected) return this.#contentEl;
    this.#contentEl = document.querySelector<HTMLElement>(CONTENT_SELECTOR);
    return this.#contentEl;
  }

  #searchingContent() {
    const content = this.#content();
    return content?.matches(SEARCHING_CONTENT_SELECTOR) ? content : null;
  }

  #searchingNav() {
    const nav = this.#nav();
    return nav?.matches(`${NAV_SELECTOR}.searching`) ? nav : null;
  }

  #restingOffset(content: HTMLElement) {
    return (
      Number.parseFloat(
        getComputedStyle(content).getPropertyValue("--content-resting-offset"),
      ) ||
      Number.parseFloat(content.style.marginTop) ||
      0
    );
  }
}
