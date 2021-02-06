const fg = require('fast-glob');
const { join, sep } = require('path');
const { copyFileSync } = require('fs');

const root = (...paths) => join(__dirname, '../..', ...paths);

console.log('Copying custom d.ts files...');
fg.sync([root('src/**/*.d.ts')])
  .forEach((file) => {
    const srcPath = root('src');
    const relativePath = file.replace(srcPath, '');

    copyFileSync(file, root('lib', relativePath));
  });
