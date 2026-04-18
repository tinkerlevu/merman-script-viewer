import chokidar from "chokidar"
import { BrowserWindow, dialog } from "electron"
import { readFileSync } from "fs"

var mainWindow: BrowserWindow // very hacky ikik

export const initalizePreProcessor = (mainInterface: BrowserWindow) =>
  mainWindow = mainInterface


const watcher = chokidar.watch([],
  { awaitWriteFinish: { stabilityThreshold: 500 }, atomic: true })
watcher.on('change', path => { loadContents(path); console.log("changing ------- ", path) })


export function openPreProcessScript() {
  const pathSelection = dialog.showOpenDialogSync({
    properties: [
      'openFile',
      'multiSelections',
    ],
    title: 'Open Pre-Processing Script',
    buttonLabel: 'Open',
    filters: [{
      name: 'Standard Javascript (*.js)',
      extensions: ['js']
    }]
  })

  console.log(pathSelection)

  pathSelection?.forEach(fpath => {
    loadContents(fpath);
    watcher.add(fpath)
  })

}

function loadContents(filepath: string) {
  const contents = readFileSync(filepath, 'utf8')
  console.log(contents)

  mainWindow.webContents.send('preprocessor_load', {
    filepath: filepath,
    text: contents,
    // title: parse(filepath).name,
    // newfile: newfile ? newfile : false
  })
}
