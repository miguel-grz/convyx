import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-convert',
  transform: { from: 'PNG', to: 'WEBP' },
  name: 'Convert image',
  category: 'image',
  summary: 'Change an image between PNG, JPG, WEBP and AVIF.',
  description:
    'Pick a target format and a quality level. Your images are converted on your own device,' +
    ' several at a time, and come back as a zip when there is more than one.',
  icon: 'repeat',
  keywords: ['png', 'jpg', 'webp', 'avif', 'format', 'convertir'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
  featured: true,
};

export default manifest;
