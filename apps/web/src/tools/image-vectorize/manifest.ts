import { ACCEPTS, OUTPUTS, type ToolManifest } from '@convyx/tool-contract';

const manifest: ToolManifest = {
  id: 'image-vectorize',
  transform: { from: 'PNG', to: 'SVG' },
  name: 'Vectorize image',
  category: 'image',
  summary: 'Trace a raster image into a clean SVG.',
  description:
    'Converts logos, line art and simple illustrations into scalable vector paths with' +
    ' vtracer. Photographs are not a good fit for this — the result will be large and noisy.',
  icon: 'spline',
  keywords: ['svg', 'trace', 'vector', 'vectorizar'],
  processing: 'server',
  status: 'planned',
  accepts: ACCEPTS.raster,
  files: { min: 1, max: 1 },
  maxFileSizeMB: 25,
  output: OUTPUTS.svg,
  endpoint: '/api/v1/tools/image-vectorize',
};

export default manifest;
