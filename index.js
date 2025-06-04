#! /usr/bin/env node

const { program } = require('commander');
const packageJSON = require("./package.json");
const searchSubFolders = require('./search-sub-folders.js');
const transformJSON = require('./transform-json.js');

program
  .name(packageJSON.name)
  .description(packageJSON.description)
  .version(packageJSON.version)
  .argument('[dir]', 'Root folder to search.', '.')
  .option('-n, --name [name]', 'Name of the file with json coverage report.', 'coverage-summary.json')
  .option('-f, --folders [folders...]', 'Folder to search', ['.'])
  .option('-l, --level [level]', 'Search depth level', 3)
  .option('-o, --only-failed', 'Show only failed suits', false)
  .option('-v, --verbose', 'Output additiona information', false)
  .option('-t, --thresholds [thresholds]', 'Thresholds for the coverage report', [90, 100])
  .action(async (dir, { name, folders, level, verbose: isVerbose, onlyFailed, thresholds }) => {

    if (isVerbose) {
      console.log({
        dir,
        name,
        folders,
        level,
        verbose: isVerbose,
        thresholds,
        onlyFailed,
      })
    }
    
    try {
      const files = await searchSubFolders(name, dir, folders, level, isVerbose);
      const report = await transformJSON(files, thresholds);
      process.stdout.write(`# Code Coverage Report

${report}\n`);
    } catch (error) {
      program.error(error.stderr ? error.stderr.toString() : error.message);
    }
  });


program.parse();