import { useEffect, useRef } from 'react';

interface ParallaxOptions {
  /** Pixels of travel per 100px scrolled. Negative moves against the scroll. */
  speed?: number;
  /** Pixels of travel at full pointer deflection. 0 disables pointer tilt. */
  pointer?: number;
}

/**
 * Moves an element slightly out of step with the page.
 *
 * Written against `transform` only and driven from a rAF loop, so it never
 * triggers layout during a scroll. Disabled entirely under reduced motion and on
 * coarse pointers, where parallax mostly reads as jitter.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
  speed = 12,
  pointer = 0,
}: ParallaxOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (prefersReduced) return;

    let frame = 0;
    let scrollOffset = 0;
    let pointerX = 0;
    let pointerY = 0;

    const apply = () => {
      frame = 0;
      element.style.transform = `translate3d(${pointerX.toFixed(2)}px, ${(
        scrollOffset + pointerY
      ).toFixed(2)}px, 0)`;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onScroll = () => {
      const { top, height } = element.getBoundingClientRect();
      // Progress of the element through the viewport, centred on 0.
      const progress = (top + height / 2 - window.innerHeight / 2) / window.innerHeight;
      scrollOffset = progress * speed * -1;
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * pointer;
      pointerY = (event.clientY / window.innerHeight - 0.5) * pointer;
      schedule();
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (pointer !== 0 && finePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [speed, pointer]);

  return ref;
}
