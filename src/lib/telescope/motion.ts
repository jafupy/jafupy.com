export const TELESCOPE_TEXT_MOTION = {
  y: "0.45em",
  blur: "blur(5px)",
  duration: 0.34,
  easeIn: "power3.in",
  easeOut: "power3.out",
  stagger: 0.006,
  clearProps: "transform,opacity,filter",
} as const;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

