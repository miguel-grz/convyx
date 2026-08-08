import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
}

/**
 * Minimal document head management for a single-page app.
 *
 * Enough for correct tab titles and link previews now; phase 9 replaces it with
 * prerendered metadata when SEO becomes a goal.
 */
export function usePageMeta({ title, description }: PageMeta): void {
  useEffect(() => {
    document.title = title;

    // Every route serves the same index.html, so the canonical link ships
    // pointing at the home page. Left alone, each tool page would tell a
    // crawler it was a copy of the home page and ask not to be indexed on its
    // own — the opposite of what a catalogue of 26 pages needs.
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `${window.location.origin}${window.location.pathname}`;

    if (!description) return;

    const tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previous = tag?.content;
    if (tag) tag.content = description;

    return () => {
      if (tag && previous !== undefined) tag.content = previous;
    };
  }, [title, description]);
}
