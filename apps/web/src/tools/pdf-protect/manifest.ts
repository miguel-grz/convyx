import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-protect',
  transform: { from: 'PDF', to: 'PDF', note: 'encrypted' },
  name: 'Protect PDF',
  category: 'pdf',
  summary: 'Add a password to a PDF.',
  description:
    'Encrypts the document so it cannot be opened without the password, and optionally' +
    ' restricts printing and copying.',
  icon: 'lock',
  keywords: ['password', 'encrypt', 'secure', 'proteger'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
  endpoint: '/api/v1/tools/pdf-protect',
};

export default manifest;
