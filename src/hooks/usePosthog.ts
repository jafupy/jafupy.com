import { useCallback } from "react";

type PostHog = {
  capture: (event: string, properties?: Record<string, any>) => void;
  identify: (distinctId: string, properties?: Record<string, any>) => void;
  alias: (alias: string) => void;
  reset: () => void;
  people?: {
    set: (props: Record<string, any>) => void;
    set_once: (props: Record<string, any>) => void;
    unset: (keys: string | string[]) => void;
    increment: (props: Record<string, number>) => void;
    append: (props: Record<string, any>) => void;
    union: (props: Record<string, any[]>) => void;
    track_charge: (amount: number, props?: Record<string, any>) => void;
    clear_charges: () => void;
    delete_user: () => void;
  };
};

declare global {
  interface Window {
    posthog?: PostHog;
  }
}

export function usePosthog() {
  const posthog = typeof window !== "undefined" ? window.posthog : undefined;
  const isReady = !!posthog;

  const capture = useCallback(
    (event: string, properties?: Record<string, any>) => {
      posthog?.capture(event, properties);
    },
    [posthog],
  );

  const identify = useCallback(
    (distinctId: string, properties?: Record<string, any>) => {
      posthog?.identify(distinctId, properties);
    },
    [posthog],
  );

  const alias = useCallback(
    (aliasId: string) => {
      posthog?.alias(aliasId);
    },
    [posthog],
  );

  const reset = useCallback(() => {
    posthog?.reset();
  }, [posthog]);

  const people = {
    set: useCallback(
      (props: Record<string, any>) => {
        posthog?.people?.set(props);
      },
      [posthog],
    ),
    set_once: useCallback(
      (props: Record<string, any>) => {
        posthog?.people?.set_once(props);
      },
      [posthog],
    ),
    unset: useCallback(
      (keys: string | string[]) => {
        posthog?.people?.unset(keys);
      },
      [posthog],
    ),
    increment: useCallback(
      (props: Record<string, number>) => {
        posthog?.people?.increment(props);
      },
      [posthog],
    ),
    append: useCallback(
      (props: Record<string, any>) => {
        posthog?.people?.append(props);
      },
      [posthog],
    ),
    union: useCallback(
      (props: Record<string, any[]>) => {
        posthog?.people?.union(props);
      },
      [posthog],
    ),
    track_charge: useCallback(
      (amount: number, props?: Record<string, any>) => {
        posthog?.people?.track_charge(amount, props);
      },
      [posthog],
    ),
    clear_charges: useCallback(() => {
      posthog?.people?.clear_charges();
    }, [posthog]),
    delete_user: useCallback(() => {
      posthog?.people?.delete_user();
    }, [posthog]),
  };

  return { isReady, capture, identify, alias, reset, people };
}
