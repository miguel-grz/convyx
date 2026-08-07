import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-to-excel',
  transform: { from: 'PDF', to: 'XLSX' },
  name: 'PDF to Excel',
  category: 'pdf',
  summary: 'Extract tables from a PDF into a spreadsheet.',
  description:
    'Detects tabular data and writes it to .xlsx so you can actually work with the numbers' +
    ' instead of retyping them.',
  icon: 'table',
  keywords: ['xlsx', 'spreadsheet', 'table', 'excel'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.xlsx,
  endpoint: '/api/v1/tools/pdf-to-excel',
};

export default manifest;
