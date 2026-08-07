import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * A disclosure that animates to its measured height.
 *
 * Built rather than imported because the height has to be real: animating to
 * `auto` does not work, and a fixed max-height either clips long content or
 * leaves a slow tail on short content. A ResizeObserver keeps the number honest
 * when the contents change.
 */
export function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = useId();

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const measure = () => setHeight(element.scrollHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className={cn('border-line border-b', className)}>
      <h3>
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="group flex w-full items-center gap-4 py-5 text-left"
        >
          <span className="group-hover:text-brand min-w-0 flex-1 font-medium transition-colors duration-150">
            {title}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              'text-fg-subtle size-4 shrink-0 transition-transform duration-300',
              open && 'rotate-180',
            )}
          />
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        // `hidden` would collapse instantly and kill the transition, so the panel
        // stays at height 0 and `inert` keeps its contents out of the tab order.
        inert={!open}
        aria-hidden={!open}
        style={{ height: open ? (height ?? 'auto') : 0 }}
        className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <div ref={contentRef} className="text-fg-muted pb-5 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
