import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-organize',
  transform: { from: 'PDF', to: 'PDF', note: 'reordered' },
  name: 'Organize PDF',
  category: 'pdf',
  summary: 'Reorder or delete pages visually.',
  description:
    'See every page as a thumbnail, drag them into a new order, and remove the ones you do' +
    ' not want. Nothing is committed until you download.',
  icon: 'layout-grid',
  keywords: ['reorder', 'delete pages', 'sort', 'organizar'],
  processing: 'client',
  status: 'available',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
  featured: true,
};

export default manifest;
