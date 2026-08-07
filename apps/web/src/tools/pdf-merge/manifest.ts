import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-merge',
  transform: { from: 'PDF+', to: 'PDF' },
  name: 'Merge PDF',
  category: 'pdf',
  summary: 'Combine several PDFs into a single document.',
  description:
    'Drop in as many PDFs as you need, drag them into the right order, and download one' +
    ' merged file. Everything happens in your browser — the files are never uploaded.',
  icon: 'layers',
  keywords: ['combine', 'join', 'concat', 'unir'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.pdf,
  files: { min: 2, max: null },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
  featured: true,
};

export default manifest;
