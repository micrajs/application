import { parse } from 'path';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot';
import pkg from '../../package.json';
import { getBabelOptions } from './babel/index';
import { config, root, build } from '../helpers/paths';
import { splitAndCapitalize } from '../helpers/splitAndCapitalize';

const tsconfig = root('tsconfig.json');
const extensions = ['.js', '.ts', '.tsx'];
const snapshotPath = config('build/.size-snapshot.json');
const external = (id) => {
  return !id.startsWith('.') && !id.startsWith(parse(process.cwd()).root);
};

const createESMConfig = (input, output) => ({
  input,
  output: { file: output, format: 'esm' },
  external,
  plugins: [
    typescript({ tsconfig }),
    babel(getBabelOptions({ node: 8 }, extensions)),
    sizeSnapshot({ snapshotPath }),
    resolve({ extensions }),
  ],
});

const createCommonJSConfig = (input, output) => ({
  input,
  output: { file: output, format: 'cjs', exports: 'named' },
  external,
  plugins: [
    typescript({ tsconfig }),
    babel(getBabelOptions({ ie: 11 }, extensions)),
    sizeSnapshot({ snapshotPath }),
    resolve({ extensions }),
  ],
});

const createIIFEConfig = (input, output, globalName) => ({
  input,
  output: {
    file: output,
    format: 'iife',
    exports: 'named',
    name: globalName,
    globals: {
      react: 'React',
    },
  },
  external,
  plugins: [
    typescript({ tsconfig }),
    babel(getBabelOptions({ ie: 11 }, extensions)),
    sizeSnapshot({ snapshotPath }),
    resolve({ extensions }),
  ],
});

const bundle = (entry, output) => [
  createCommonJSConfig(entry, build(`${output}.js`)),
  createESMConfig(entry, build(`${output}.mjs.js`)),
  createIIFEConfig(
    entry,
    build(`${output}.iife.js`),
    splitAndCapitalize('/', '-', '_')(pkg.name.replace('@', '')),
  ),
];

export default [
  ...bundle(root('src/sync/index.ts'), 'sync/index'),
  ...bundle(root('src/async/index.ts'), 'async/index'),
];
