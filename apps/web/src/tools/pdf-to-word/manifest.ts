import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-to-word',
  transform: { from: 'PDF', to: 'DOCX' },
  name: 'PDF to Word',
  category: 'pdf',
  summary: 'Convert a PDF into an editable .docx.',
  description:
    'Keeps the layout, fonts and tables as close to the original as the format allows. Runs' +
    ' on the server because high-fidelity conversion needs LibreOffice.',
  icon: 'file-type',
  keywords: ['docx', 'editable', 'office', 'word'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.docx,
  endpoint: '/api/v1/tools/pdf-to-word',
  featured: true,
};

export default manifest;
