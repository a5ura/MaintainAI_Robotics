import { useLayoutEffect, useEffect, useRef, useState, useMemo } from "react";
import type { GuideState } from "./guided";
import { GUIDE_TARGETS, type GuideTarget } from "./guideTargets";
const DESCRIPTION = "guided-focus-description";
const find = (id: string) =>
  document.querySelector<HTMLElement>(`[data-guide-target="${id}"]`);
export function visibleTarget(
  element: HTMLElement | null,
): element is HTMLElement {
  return (
    !!element?.isConnected &&
    !element.closest('[hidden], [aria-hidden="true"]') &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== "hidden"
  );
}
// Presentation only: no clock, diagnosis, selection, speech or API callbacks.
export function useGuideVisuals(state: GuideState) {
  const [missing, setMissing] = useState(false);
  const session = useRef<number | null>(null);
  const ownedFocus = useRef<HTMLElement | null>(null);
  const request = useRef<(id: string, focus: boolean) => void>(() => {});
  const cancel = useRef<() => void>(() => {});
  const epoch = state?.epoch;
  const stage = state?.stage;
  const token = useMemo(() => ({ epoch, stage }), [epoch, stage]);
  const activation = useRef<typeof token | null>(null);
  useLayoutEffect(() => {
    if (epoch === undefined) {
      if (
        session.current !== null &&
        ownedFocus.current &&
        (document.activeElement === document.body ||
          document.activeElement === ownedFocus.current)
      ) {
        document.querySelector<HTMLElement>("[data-guide-start]")?.focus();
      }
      session.current = null;
      ownedFocus.current = null;
      return;
    }
    session.current = epoch;
  }, [epoch]);
  useLayoutEffect(() => {
    if (epoch === undefined || !stage) return;
    activation.current = token;
    let alive = true,
      frame = 0,
      scrolled = false,
      scrolling = false;
    let currentTarget: string = GUIDE_TARGETS[stage].primary;
    const marked = new Map<HTMLElement, string | null>();
    const root = document.documentElement;
    const previousActive = root.getAttribute("data-guide-active");
    const previousHeight = root.style.getPropertyValue("--guide-nav-height");
    root.setAttribute("data-guide-active", "true");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    function finish() {
      scrolling = false;
    }
    function cancelMotion() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (scrolling)
        window.scrollTo({
          top: window.scrollY,
          left: window.scrollX,
          behavior: "instant",
        });
      finish();
    }
    cancel.current = cancelMotion;
    function navHeight() {
      if (!alive) return 0;
      const height =
        document
          .querySelector<HTMLElement>("[data-guide-navigation]")
          ?.getBoundingClientRect().height ?? 0;
      const value = `${Math.ceil(height)}px`;
      if (root.style.getPropertyValue("--guide-nav-height") !== value)
        root.style.setProperty("--guide-nav-height", value);
      return height;
    }
    function reveal(id: string, focus: boolean, immediate = false) {
      const target = find(id);
      if (!alive || document.hidden || !visibleTarget(target)) return;
      currentTarget = id;
      const top = navHeight() + 16;
      const rect = target.getBoundingClientRect();
      const needed = Math.min(
        rect.height,
        Math.max(60, innerHeight - top - 20),
      );
      if (rect.top < top || rect.top + needed > innerHeight - 12) {
        cancelMotion();
        scrolling = true;
        window.scrollTo({
          top: Math.max(0, scrollY + rect.top - top),
          left: scrollX,
          behavior: reduced?.matches || immediate ? "instant" : "smooth",
        });
      }
      if (focus) {
        ownedFocus.current = target;
        target.focus({ preventScroll: true });
      }
    }
    function schedule(id: string, focus: boolean, immediate = false) {
      if (!alive) return;
      cancelMotion();
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (alive) reveal(id, focus, immediate);
      });
    }
    request.current = (id, focus) => schedule(id, focus);
    function unmark(element: HTMLElement) {
      element.removeAttribute("data-guide-highlight");
      const ids = (element.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((id) => id && id !== DESCRIPTION);
      if (ids.length) element.setAttribute("aria-describedby", ids.join(" "));
      else element.removeAttribute("aria-describedby");
      marked.delete(element);
    }
    function reconcile() {
      if (!alive) return;
      const spec = GUIDE_TARGETS[stage!];
      const desired = new Map<HTMLElement, "primary" | "secondary">();
      for (const [id, kind] of [
        [spec.primary, "primary"],
        ...spec.secondary.map((id) => [id, "secondary"]),
      ] as [string, "primary" | "secondary"][]) {
        const element = find(id);
        if (visibleTarget(element)) desired.set(element, kind);
      }
      for (const element of marked.keys())
        if (!desired.has(element)) unmark(element);
      for (const [element, kind] of desired) {
        if (!marked.has(element)) {
          marked.set(element, element.getAttribute("aria-describedby"));
          const previous = element.getAttribute("aria-describedby");
          element.setAttribute(
            "aria-describedby",
            [previous, DESCRIPTION].filter(Boolean).join(" "),
          );
          element.setAttribute("data-guide-highlight", kind);
        }
      }
      const primary = find(spec.primary);
      const available = visibleTarget(primary);
      setMissing(!available);
      navHeight();
      if (available && !scrolled && !document.hidden) {
        scrolled = true;
        schedule(spec.primary, false);
      }
    }
    function resize() {
      if (!alive) return;
      reconcile();
      schedule(currentTarget, false, true);
    }
    function visibility() {
      if (document.hidden) {
        scrolled = true;
        cancelMotion();
      } else reconcile();
    }
    function preference() {
      if (reduced?.matches) cancelMotion();
    }
    function userInput() {
      cancelMotion();
    }
    function keyInput(event: KeyboardEvent) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
          "Tab",
          "Escape",
        ].includes(event.key)
      )
        userInput();
    }
    function focusIn(event: FocusEvent) {
      const target = event.target as HTMLElement;
      if (
        target.closest?.("[data-guide-navigation], [data-guide-panel]") ||
        target === ownedFocus.current
      )
        ownedFocus.current = target;
      else ownedFocus.current = null;
    }
    const observer = new MutationObserver(reconcile);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "aria-hidden", "class", "style"],
    });
    const nav = document.querySelector("[data-guide-navigation]");
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            navHeight();
          });
    if (nav) resizeObserver?.observe(nav);
    reduced?.addEventListener?.("change", preference);
    window.addEventListener("resize", resize);
    window.addEventListener("scrollend", finish);
    window.addEventListener("wheel", userInput, { passive: true });
    window.addEventListener("pointerdown", userInput, { passive: true });
    window.addEventListener("keydown", keyInput);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("focusin", focusIn);
    reconcile();
    return () => {
      alive = false;
      if (activation.current === token) activation.current = null;
      cancelMotion();
      request.current = () => {};
      cancel.current = () => {};
      observer.disconnect();
      resizeObserver?.disconnect();
      reduced?.removeEventListener?.("change", preference);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scrollend", finish);
      window.removeEventListener("wheel", userInput);
      window.removeEventListener("pointerdown", userInput);
      window.removeEventListener("keydown", keyInput);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("focusin", focusIn);
      for (const element of marked.keys()) unmark(element);
      if (previousActive === null) root.removeAttribute("data-guide-active");
      else root.setAttribute("data-guide-active", previousActive);
      if (previousHeight)
        root.style.setProperty("--guide-nav-height", previousHeight);
      else root.style.removeProperty("--guide-nav-height");
    };
  }, [epoch, stage, token]);
  useEffect(() => {
    if (state?.paused) cancel.current();
  }, [state?.paused]);
  return {
    missing,
    reveal: (id: GuideTarget) => {
      if (activation.current === token) request.current(id, true);
    },
    controls: () => {
      if (activation.current === token)
        request.current("walkthrough-controls", true);
    },
  };
}
