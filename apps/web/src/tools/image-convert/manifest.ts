import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-convert',
  transform: { from: 'PNG', to: 'WEBP' },
  name: 'Convert image',
  category: 'image',
  summary: 'Change an image between PNG, JPG, WEBP and AVIF.',
  description:
    'Pick a target format and quality; conversion happens on a canvas in your browser. Batch' +
    ' several files at once and get them back as a zip.',
  icon: 'repeat',
  keywords: ['png', 'jpg', 'webp', 'avif', 'format', 'convertir'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.image,
  files: { min: 1, max: null },
  maxFileSizeMB: 50,
  output: OUTPUTS.zip,
  featured: true,
};

export default manifest;
