import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'office-to-pdf',
  transform: { from: 'DOCX', to: 'PDF' },
  name: 'Office to PDF',
  category: 'pdf',
  summary: 'Convert Word, Excel or PowerPoint files to PDF.',
  description:
    'Handles .docx, .xlsx, .pptx and their OpenDocument equivalents through headless' +
    ' LibreOffice, so the output matches what you see in the original app.',
  icon: 'file-check',
  keywords: ['word', 'excel', 'powerpoint', 'docx', 'convert'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.office,
  files: { min: 1, max: null },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
  endpoint: '/api/v1/tools/office-to-pdf',
};

export default manifest;
