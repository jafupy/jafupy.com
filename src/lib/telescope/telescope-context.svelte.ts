import { getContext, setContext } from "svelte";

export type TelescopeContext = {
  getOpen: () => boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const TELESCOPE_CONTEXT = Symbol("telescope");

export function setTelescopeContext(context: TelescopeContext) {
  setContext(TELESCOPE_CONTEXT, context);
}

export function getTelescopeContext() {
  const context = getContext<TelescopeContext | undefined>(TELESCOPE_CONTEXT);

  if (!context) {
    throw new Error("Telescope components must be used inside <T>.");
  }

  return context;
}
