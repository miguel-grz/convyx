import { useEffect, useRef } from 'react';

interface RevealOptions {
  /** Milliseconds to stagger this element behind its neighbours. */
  delay?: number;
  /** How much of the element must be visible before it settles. */
  threshold?: number;
  /** Reveal once and stop observing. Elements should not re-hide on scroll up. */
  once?: boolean;
}

/**
 * Settles an element into place when it scrolls into view.
 *
 * The attribute is added *here*, not in the markup, which is the whole safety
 * property: content ships visible and this hook opts it into being animated. If
 * the script never runs, the observer is unavailable, or motion is reduced, the
 * element simply stays visible. A decorative animation must never be able to
 * hide content — and an element that is only revealed on intersection is
 * invisible to a full-page screenshot, a print, and Reader mode too.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  delay = 0,
  threshold = 0.15,
  once = true,
}: RevealOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.dataset.reveal = 'false';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.dataset.reveal = 'true';
            if (once) observer.unobserve(element);
          } else if (!once) {
            element.dataset.reveal = 'false';
          }
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  return ref;
}
