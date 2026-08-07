import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DropdownProps {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  panelClassName?: string;
}

/**
 * A navigation menu that closes the way a menu should: on Escape, on outside
 * pointer down, and whenever focus leaves it — including via Tab, which is the
 * case hand-rolled dropdowns usually miss.
 */
export function Dropdown({ label, children, panelClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const outside = (event: Event) =>
      !containerRef.current?.contains(event.target as Node) && setOpen(false);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'hover:text-fg flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
          open ? 'text-fg' : 'text-fg-muted',
        )}
      >
        {label}
        <ChevronDown
          aria-hidden
          className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className={cn(
            'border-line bg-bg-panel shadow-float absolute top-full left-0 z-50 mt-1.5 rounded-xl border',
            'animate-[pop-in_160ms_cubic-bezier(0.16,1,0.3,1)]',
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
