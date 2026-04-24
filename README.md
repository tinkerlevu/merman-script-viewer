# Merman Script Viewer

For visualizing graphs using the merman flowchart markup language

Meant primarily for writing visual novels and dynamic/interactive narrative stories


This software is still very incomplete, untested and in an alpha stage, only base functionality works as far as I can tell.

Our team will be using this tool to develop a proof of concept visual novel and when that's done it will work as a reference and example of usage

All features and syntax is subject to change until our proof of concept is finalized. use of this tool for anything other than minor experimentation is heavily discouraged at this point.

We will update once the software is mature enough for actual use.

Have only tested build on linux so far.


## TODO:

- merman syntax highlighting
- more node types
- merman reference info
- actual documentation on how to use merman
- !!! REMOVE ALL UNNECESSARY CONSOLE LOGS
- implement dry run for preprocessor
- clean up code
- nvim instructions for highlighting
- highlighting for other major editors
- document ANALYZE, read, write, console.log/console.push/console.throw/console.html + line.number index text all preprocessor vars
- preprocessor docs and example implementations
- arbitary mermaid graphs in todo and remember reports
- finish other noted TODOs in code
- figure out which license would apply with all the various packages used in this project

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
$ npm run build:linux-appimage
```
