import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-split',
  transform: { from: 'PDF', to: 'PDF+' },
  name: 'Split PDF',
  category: 'pdf',
  summary: 'Cut a PDF into separate documents by page range.',
  description:
    'Split a document at any page, or pull out several ranges at once. Each range becomes its' +
    ' own PDF, delivered as a zip when there is more than one.',
  icon: 'scissors',
  keywords: ['divide', 'cut', 'separate', 'dividir'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.zip,
};

export default manifest;
