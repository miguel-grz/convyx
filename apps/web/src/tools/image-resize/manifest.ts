import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-resize',
  transform: { from: 'PNG', to: 'PNG', note: 'resized' },
  name: 'Resize image',
  category: 'image',
  summary: 'Change dimensions by pixels or percentage.',
  description:
    'Resize one image or a whole batch, with the aspect ratio locked by default. Downscaling' +
    ' is done in steps to avoid the mush you get from a single big jump.',
  icon: 'scaling',
  keywords: ['scale', 'dimensions', 'width', 'redimensionar'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.image,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
};

export default manifest;
