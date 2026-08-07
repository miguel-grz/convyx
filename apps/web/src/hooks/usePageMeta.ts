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

    if (!description) return;

    const tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previous = tag?.content;
    if (tag) tag.content = description;

    return () => {
      if (tag && previous !== undefined) tag.content = previous;
    };
  }, [title, description]);
}
