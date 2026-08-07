import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-compress',
  transform: { from: 'PNG', to: 'PNG', note: 'smaller' },
  name: 'Compress image',
  category: 'image',
  summary: 'Make images smaller with a quality slider you control.',
  description:
    'Re-encodes the image at the quality you choose and shows the before/after size and a' +
    ' side-by-side preview, so you can stop at the point where it still looks right.',
  icon: 'minimize-2',
  keywords: ['reduce', 'optimize', 'smaller', 'comprimir'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
  featured: true,
};

export default manifest;
