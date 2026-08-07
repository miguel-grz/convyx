import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-remove-background',
  transform: { from: 'JPG', to: 'PNG', note: 'cut out' },
  name: 'Remove background',
  category: 'image',
  summary: 'Cut the subject out of a photo.',
  description:
    'Uses a U²-Net segmentation model to isolate the subject and returns a PNG with a' +
    ' transparent background. Works best on people, products and animals.',
  icon: 'eraser',
  keywords: ['transparent', 'cutout', 'png', 'quitar fondo'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 25,
  output: OUTPUTS.png,
  endpoint: '/api/v1/tools/image-remove-background',
  featured: true,
};

export default manifest;
