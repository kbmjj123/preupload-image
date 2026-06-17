import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const input = 'src/index.js';

export default [
  // ESM
  {
    input,
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  },
  // CJS
  {
    input,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
  },
  // UMD (CDN-friendly)
  {
    input,
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'PreuploadImage',
      sourcemap: true,
    },
  },
  // Minified UMD for CDN
  {
    input,
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'PreuploadImage',
    },
    plugins: [terser()],
  },
  // TypeScript declarations
  {
    input: 'src/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];
