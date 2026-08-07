import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import type { PagePreview } from './useThumbnails';

export interface PageState extends PagePreview {
  removed: boolean;
}

interface PageGridProps {
  pages: PageState[];
  onChange: (pages: PageState[]) => void;
  disabled?: boolean;
}

/**
 * The page grid: drag to reorder, buttons to do the same without a pointer.
 *
 * Drag is the fast path, not the only one. Someone on a keyboard, on a phone,
 * or using a screen reader gets the same two moves from real buttons, which is
 * also what makes the reorder announceable — a drag operation is invisible to
 * assistive technology unless it is reimplemented from scratch.
 *
 * Removing is reversible. A deleted page keeps its slot, greyed, with a restore
 * button: destructive-and-gone would make a mis-click cost the whole session.
 */
export function PageGrid({ pages, onChange, disabled }: PageGridProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= pages.length || from === to) return;

    const next = [...pages];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    onChange(next);
  };

  const toggle = (index: number) => {
    onChange(pages.map((page, i) => (i === index ? { ...page, removed: !page.removed } : page)));
  };

  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {pages.map((page, index) => (
        <li
          key={page.pageNumber}
          draggable={!disabled}
          onDragStart={() => setDragging(index)}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(index);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging !== null) move(dragging, index);
            setDragging(null);
            setOver(null);
          }}
          className={cn(
            'group border-line bg-bg-panel relative rounded-xl border p-2 transition-[border-color,opacity,transform] duration-150',
            !disabled && 'cursor-grab active:cursor-grabbing',
            over === index &&
              dragging !== null &&
              dragging !== index &&
              'border-brand scale-[1.02]',
            dragging === index && 'opacity-40',
            page.removed && 'opacity-45',
          )}
        >
          <div className="bg-bg-inset relative overflow-hidden rounded-lg">
            <img
              src={page.url}
              alt={`Page ${page.pageNumber}`}
              width={page.width}
              height={page.height}
              draggable={false}
              className={cn('block h-auto w-full', page.removed && 'grayscale')}
            />

            <span className="bg-bg/85 absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur-sm">
              {page.pageNumber}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Move page ${page.pageNumber} earlier`}
                disabled={disabled || index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Move page ${page.pageNumber} later`}
                disabled={disabled || index === pages.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowRight />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn('size-8', !page.removed && 'hover:text-danger')}
              aria-label={
                page.removed ? `Keep page ${page.pageNumber}` : `Remove page ${page.pageNumber}`
              }
              disabled={disabled}
              onClick={() => toggle(index)}
            >
              {page.removed ? <RotateCcw /> : <Trash2 />}
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
