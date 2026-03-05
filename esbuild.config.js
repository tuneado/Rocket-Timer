const esbuild = require('esbuild');

esbuild.build({
  entryPoints: [
    'src/renderer/index.jsx',
    'src/renderer/settings.jsx',
  ],
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
