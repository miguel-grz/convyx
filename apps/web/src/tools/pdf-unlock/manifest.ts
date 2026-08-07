import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-unlock',
  transform: { from: 'PDF', to: 'PDF', note: 'decrypted' },
  name: 'Unlock PDF',
  category: 'pdf',
  summary: 'Remove a password you already know.',
  description:
    'Strips the password from a PDF you can already open. It does not break encryption — you' +
    ' have to supply the correct password.',
  icon: 'lock-open',
  keywords: ['password', 'decrypt', 'remove', 'desbloquear'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
  endpoint: '/api/v1/tools/pdf-unlock',
};

export default manifest;
