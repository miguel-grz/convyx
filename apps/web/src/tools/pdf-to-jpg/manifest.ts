import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-to-jpg',
  transform: { from: 'PDF', to: 'JPG+' },
  name: 'PDF to JPG',
  category: 'pdf',
  summary: 'Turn every page into an image.',
  description:
    'Renders each page to a JPG at the resolution you choose. Pages are rendered with pdf.js' +
    ' in your browser, so scanned or confidential documents stay on your device.',
  icon: 'image-down',
  keywords: ['convert', 'png', 'picture', 'imagen'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.zip,
  featured: true,
};

export default manifest;
