/** Holds a tool's footprint while its chunk loads, so nothing jumps. */
export function ToolSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="border-line bg-bg-raised/40 h-44 rounded-xl border border-dashed" />
      <div className="bg-bg-raised h-12 rounded-lg" />
    </div>
  );
}
