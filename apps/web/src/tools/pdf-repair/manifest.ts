import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-repair',
  transform: { from: 'PDF', to: 'PDF', note: 'rebuilt' },
  name: 'Repair PDF',
  category: 'pdf',
  summary: 'Recover a PDF that will not open.',
  description:
    'Rebuilds the cross-reference table and object structure of a damaged file. It cannot' +
    ' recover data that is genuinely gone, but it rescues most truncated downloads.',
  icon: 'wrench',
  keywords: ['fix', 'corrupt', 'damaged', 'reparar'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 200,
  output: OUTPUTS.pdf,
  endpoint: '/api/v1/tools/pdf-repair',
};

export default manifest;
