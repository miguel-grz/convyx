import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { searchTools } from '@/tools/registry';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const MAX_SUGGESTIONS = 6;

/**
 * The landing page's way into the catalogue.
 *
 * It is a combobox rather than a plain field because the grid no longer sits
 * underneath it: typing has to lead somewhere. Picking a suggestion opens the
 * tool; pressing Enter without one opens the catalogue filtered by the query,
 * so nothing typed here is ever a dead end.
 */
export function ToolSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const navigate = useNavigate();

  const matches = useMemo(
    () => (query.trim() ? searchTools(query).slice(0, MAX_SUGGESTIONS) : []),
    [query],
  );

  useEffect(() => setActive(-1), [query]);

  useEffect(() => {
    if (!open) return;

    const outside = (event: Event) =>
      !containerRef.current?.contains(event.target as Node) && setOpen(false);

    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const go = (index: number) => {
    const tool = matches[index];
    if (tool) navigate(`/tools/${tool.id}`);
    else if (query.trim()) navigate(`/tools?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      go(active);
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (matches.length === 0) return;

    event.preventDefault();
    setOpen(true);
    setActive((current) => {
      const next = event.key === 'ArrowDown' ? current + 1 : current - 1;
      // Wrapping past either end returns to the plain query, which is the
      // "search everything" option rather than a seventh tool.
      if (next >= matches.length) return -1;
      if (next < -1) return matches.length - 1;
      return next;
    });
  };

  const showList = open && matches.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search
        className="text-fg-subtle pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
        aria-hidden
      />

      <input
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label="Search tools"
        placeholder="What do you need to do?"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="border-line-strong bg-bg-panel placeholder:text-fg-subtle focus:border-brand shadow-card h-14 w-full rounded-xl border pr-4 pl-12 text-base transition-colors duration-150"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching tools"
          className="border-line bg-bg-panel shadow-float animate-[pop-in_140ms_cubic-bezier(0.16,1,0.3,1)] absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-xl border p-1.5 text-left"
        >
          {matches.map((tool, index) => (
            <li
              key={tool.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
            >
              <button
                type="button"
                data-category={tool.category}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(index)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors duration-100',
                  index === active ? 'bg-bg-raised' : 'bg-transparent',
                )}
              >
                <span className="cat-tint flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Icon name={tool.icon} className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{tool.name}</span>
                  <span className="text-fg-subtle block truncate text-xs">{tool.summary}</span>
                </span>

                {tool.status === 'planned' ? (
                  <Badge variant="outline">Soon</Badge>
                ) : (
                  <CornerDownLeft
                    className={cn(
                      'text-fg-subtle size-3.5 shrink-0 transition-opacity',
                      index === active ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                )}
              </button>
            </li>
          ))}

          <li role="option" aria-selected={active === -1}>
            <button
              type="button"
              onMouseEnter={() => setActive(-1)}
              onClick={() => go(-1)}
              className={cn(
                'border-line mt-1.5 flex w-full items-center gap-2 rounded-lg border-t p-2.5 text-left text-sm transition-colors duration-100',
                active === -1 ? 'text-fg' : 'text-fg-muted',
              )}
            >
              <Search className="size-3.5 shrink-0" aria-hidden />
              Search the whole catalogue for “{query.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
