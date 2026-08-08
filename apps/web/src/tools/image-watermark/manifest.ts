import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-watermark',
  transform: { from: 'PNG', to: 'PNG', note: 'stamped' },
  name: 'Watermark image',
  category: 'image',
  summary: 'Add a text or logo watermark to images.',
  description:
    'Position, scale and fade the watermark, then apply it to every image in the batch at' +
    ' once.',
  icon: 'droplet',
  keywords: ['logo', 'stamp', 'brand', 'marca de agua'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
};

export default manifest;
