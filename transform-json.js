'use strict';
const fs = require('fs').promises;
const path = require('path');
const { readFileSync, existsSync } = require('fs');


const findPackageJson = (startPath, level = 3) => {
  const packageJsonPath = path.join(startPath, 'package.json');

  if (existsSync(packageJsonPath)) {
    const content = readFileSync(packageJsonPath, 'utf8');
    const { name } = JSON.parse(content);
    return name;
  }

  if (level === 0) return null;

  const parentPath = path.dirname(startPath);
    
  return findPackageJson(parentPath, level - 1);
};

module.exports = async (filenames) => {
  const { markdownTable } = await import('markdown-table');
  let markdown = '';
  const files = new Map();
  const promisesList = filenames.map(async (filename) => {
    const packageName = findPackageJson(path.dirname(filename));
    const content = await fs.readFile(filename, 'utf8');
    const parsedContent = JSON.parse(content);
    files.set(packageName, parsedContent.total);
    return content;
  });
  await Promise.all(promisesList);
  const table = [
    ['Package', 'Lines', 'Statements', 'Functions', 'Branches'],
  ];
  files.forEach((total, packageName) => {
    table.push([packageName, total.lines.pct, total.statements.pct, total.functions.pct, total.branches.pct]);
  });
  return markdownTable(table);
};
