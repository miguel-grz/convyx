import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-page-numbers',
  transform: { from: 'PDF', to: 'PDF', note: 'numbered' },
  name: 'Add page numbers',
  category: 'pdf',
  summary: 'Number the pages of a PDF.',
  description:
    'Choose the position, starting number and format — plain numbers or “Page 3 of 20”. Added' +
    ' in your browser with pdf-lib.',
  icon: 'hash',
  keywords: ['numbering', 'pagination', 'folio', 'numeracion'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
};

export default manifest;
