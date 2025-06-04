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

const checkColor = (value, threshold) => {
  if (value >= threshold[0] && value < threshold[1]) {
    return '🟡';
  } else if (value >= threshold[1]) {
    return '🟢';
  } else {
    return '🔴';
  }
}

module.exports = async (filenames, thresholds) => {
  const { markdownTable } = await import('markdown-table');
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
    delete total.branchesTrue;
    let flag = '🔴';
    const isPassingMinThresholds = Object.keys(total).every(key => total[key].pct >= thresholds[0]);
    if (isPassingMinThresholds) {
      flag = '🟡';
    }
    const isPassingMaxThresholds = Object.keys(total).every(key => total[key].pct >= thresholds[1]);
    if (isPassingMaxThresholds) {
      flag = '🟢';
    }
    table.push([
      `${flag} ${packageName}`, 
      `${checkColor(total.lines.pct, thresholds)} ${total.lines.pct}%`, 
      `${checkColor(total.statements.pct, thresholds)} ${total.statements.pct}%`, 
      `${checkColor(total.functions.pct, thresholds)} ${total.functions.pct}%`, 
      `${checkColor(total.branches.pct, thresholds)} ${total.branches.pct}%`,
    ]);
  });
  return markdownTable(table);
};
