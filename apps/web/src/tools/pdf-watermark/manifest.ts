import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'pdf-watermark',
  transform: { from: 'PDF', to: 'PDF', note: 'stamped' },
  name: 'Watermark PDF',
  category: 'pdf',
  summary: 'Stamp text or a logo across every page.',
  description:
    'Set the text, angle, opacity and position, or drop in an image. The preview shows' +
    ' exactly what you will get before you download.',
  icon: 'stamp',
  keywords: ['stamp', 'logo', 'draft', 'marca de agua'],
  processing: 'client',
  status: 'planned',
  accepts: ACCEPTS.pdf,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 100,
  output: OUTPUTS.pdf,
};

export default manifest;
