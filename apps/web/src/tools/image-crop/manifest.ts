import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-crop',
  transform: { from: 'PNG', to: 'PNG', note: 'cropped' },
  name: 'Crop image',
  category: 'image',
  summary: 'Trim an image to the part you want.',
  description:
    'Drag a selection over the preview, or lock it to a common aspect ratio like 1:1 or 16:9.',
  icon: 'crop',
  keywords: ['trim', 'cut', 'aspect ratio', 'recortar'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 50,
  output: OUTPUTS.png,
};

export default manifest;
