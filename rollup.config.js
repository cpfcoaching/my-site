import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'static/js/webslides.js',
    output: {
      file: 'static/js/webslides.min.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  },
  {
    input: 'static/js/svg-icons.js',
    output: {
      file: 'static/js/svg-icons.min.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  }
];