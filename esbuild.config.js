/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
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
