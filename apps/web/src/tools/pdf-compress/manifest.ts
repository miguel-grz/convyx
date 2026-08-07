import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-compress',
  transform: { from: 'PDF', to: 'PDF', note: 'smaller' },
  name: 'Compress PDF',
  category: 'pdf',
  summary: 'Shrink a PDF without wrecking how it looks.',
  description:
    'Downsamples images and strips redundant data with Ghostscript. You choose the balance' +
    ' between size and quality, and see the result before downloading.',
  icon: 'archive',
  keywords: ['reduce', 'smaller', 'optimize', 'comprimir'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 200,
  output: OUTPUTS.pdf,
  endpoint: '/api/v1/tools/pdf-compress',
  featured: true,
};

export default manifest;
