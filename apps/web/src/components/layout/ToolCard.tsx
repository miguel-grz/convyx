import { Link } from 'react-router-dom';
import { Laptop, Server } from 'lucide-react';
import type { ToolManifest } from '@convyx/tool-contract';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';

/**
 * One card wherever a tool is listed. The icon tile takes the category's hue, so
 * a grid of 26 tools can be scanned by colour before a single label is read.
 */
export function ToolCard({ tool }: { tool: ToolManifest }) {
  const planned = tool.status === 'planned';

  return (
    <Link
      to={`/tools/${tool.id}`}
      data-category={tool.category}
      className={cn(
        'group border-line bg-bg-panel hover:border-line-strong hover:shadow-card relative flex flex-col gap-3 rounded-xl border p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5',
        planned && 'opacity-70 hover:opacity-100',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="cat-tint flex size-10 items-center justify-center rounded-lg">
          <Icon name={tool.icon} />
        </span>

        {planned ? (
          <Badge variant="outline">Soon</Badge>
        ) : tool.processing === 'client' ? (
          <Badge variant="ok" title="Runs in your browser — the file is never uploaded">
            <Laptop />
            On device
          </Badge>
        ) : (
          <Badge variant="neutral" title="Processed on our server, then deleted">
            <Server />
            Server
          </Badge>
        )}
      </div>

      <div>
        <h3 className="group-hover:text-brand font-medium transition-colors duration-150">
          {tool.name}
        </h3>
        <p className="text-fg-muted mt-0.5 text-[0.8125rem] leading-snug">{tool.summary}</p>
      </div>
    </Link>
  );
}
