/**
 * Shared modern web primitives with progressive-enhancement fallbacks
 * for task yielding, reduced motion, scrollend, and content-visibility.
 */

interface SchedulerLike {
  yield?: () => Promise<void>;
}

/**
 * Yield control back to the main thread so input and paint stay responsive
 * during multi-step work (uses scheduler.yield() with setTimeout fallback).
 */
export function yieldToMain(): Promise<void> {
  if (typeof window !== "undefined") {
    const win = window as Window & { scheduler?: SchedulerLike };
    if (win.scheduler && typeof win.scheduler.yield === "function") {
      return win.scheduler.yield();
    }
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** Return whether the user currently prefers reduced motion (SSR-safe). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribe to live OS prefers-reduced-motion changes; returns cleanup. */
export function subscribeReducedMotion(onChange: (matches: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (event: MediaQueryListEvent) => {
    onChange(event.matches);
  };
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

/**
 * Run callback once scrolling settles using the native scrollend event
 * with a debounced passive scroll fallback on browsers without onscrollend.
 */
export function onScrollEnd(
  target: Window | HTMLElement,
  callback: () => void,
  fallbackDelayMs = 120
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  if ("onscrollend" in window) {
    target.addEventListener("scrollend", callback, { passive: true });
    return () => target.removeEventListener("scrollend", callback);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(callback, fallbackDelayMs);
  };
  target.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    target.removeEventListener("scroll", onScroll);
  };
}

/**
 * Listen directly on an element with content-visibility: auto for browser
 * render-skipping changes (contentvisibilityautostatechange does not bubble reliably).
 */
export function onContentVisibilityChange(
  element: HTMLElement | null,
  onChange: (skipped: boolean) => void
): () => void {
  if (!element || typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: Event) => {
    const skipped = Boolean((event as Event & { skipped?: boolean }).skipped);
    onChange(skipped);
  };
  element.addEventListener("contentvisibilityautostatechange", handler);
  return () => element.removeEventListener("contentvisibilityautostatechange", handler);
}
