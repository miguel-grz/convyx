import { useEffect, useRef, useState } from 'react';

/**
 * Counts from zero to a target once the element scrolls into view.
 *
 * The value starts at the target rather than at zero, so a visitor with reduced
 * motion, a failed script or a disabled observer reads the real number instead
 * of a permanent "0" — the same rule the scroll reveal follows.
 */
export function useCountUp<T extends HTMLElement = HTMLDivElement>(
  target: number,
  { duration = 1100 }: { duration?: number } = {},
) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    setValue(0);
    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.unobserve(element);

        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out cubic: fast off the mark, settling into the final number.
          setValue(Math.round(target * (1 - (1 - progress) ** 3)));
          if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return { ref, value };
}
