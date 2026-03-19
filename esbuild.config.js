const esbuild = require('esbuild');

esbuild.build({
  entryPoints: {
    'renderer.bundle': 'src/renderer/index.jsx',
    'settings': 'src/renderer/settings.jsx',
  },
  bundle: true,
  outdir: 'src/renderer/dist',
  format: 'esm',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
  },
}).catch(() => process.exit(1));
