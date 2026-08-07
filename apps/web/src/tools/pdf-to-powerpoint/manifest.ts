import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-to-powerpoint',
  transform: { from: 'PDF', to: 'PPTX' },
  name: 'PDF to PowerPoint',
  category: 'pdf',
  summary: 'Convert a PDF into an editable slide deck.',
  description:
    'Each page becomes a slide with its text and images preserved, ready to edit in' +
    ' PowerPoint or Keynote.',
  icon: 'presentation',
  keywords: ['pptx', 'slides', 'deck', 'powerpoint'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pptx,
  endpoint: '/api/v1/tools/pdf-to-powerpoint',
};

export default manifest;
