import { BrowserWindow, dialog } from "electron"
import { extname, parse } from "path"
import { existsSync, writeFileSync, openSync, fstatSync, PathOrFileDescriptor, readSync, writeSync, ftruncateSync, closeSync } from "fs"
import { MonitoredFile } from "./env"
import chokidar from "chokidar"

const supported_extensions = [
  'mmn',
  'merman',
  'Merman',
  'MERMAN',
  'MMN'
]

const default_newFileContent = `
"hello"
"world"
`

var mainWindow: BrowserWindow // very hacky ikik

export const initalizeFS = (mainInterface: BrowserWindow) =>
  mainWindow = mainInterface


export default async function openMermaidFile() {
  const pathSelection = await dialog.showSaveDialog({
    // properties: ['openFile', 'promptToCreate'],
    properties: [
      'createDirectory',
    ],
    title: 'Open Existing or Create New Script',
    buttonLabel: 'Select',
    filters: [{
      name: 'Merman',
      extensions: supported_extensions
    }]
  })
  console.log(pathSelection)

  if (pathSelection.canceled) return null

  var filepath = pathSelection.filePath

  if (existsSync(filepath)) {

    console.log('file exists')

  } else { // NOTE: Create new file

    const file_ext = extname(filepath.slice(1))

    if (!supported_extensions.includes(file_ext.toLowerCase()))
      filepath += '.merman'

    writeFileSync(filepath, default_newFileContent)

  }
  //IPC send open existing file and have separate ipc if implementing no auto refresh feature
  startMonitorFile(filepath) // auto update
  loadFileContents(filepath) // send IPC with contents

  return filepath
}


export async function SaveAsFile(old_filepath, text) {
  const new_filepath = await openMermaidFile()

  if (!new_filepath) return

  writeFileContents(new_filepath, text) // write to new file
  // closeFile(old_filepath) // stop watching and drop old file
  mainWindow.webContents.send('save_as_change', {
    old_filepath: old_filepath,
    new_filepath: new_filepath
    // rename entries in the interface
  })


}


// WARNING: make sure there is always corresponding filepath in monitoredFiles
var monitoredFiles: Array<MonitoredFile> = [] // all files with fs.Watch applied to them
const watcher = chokidar.watch([])
watcher.on('change', path => loadFileContents(path)) // send file changes to renderer here


// filepath is used as an id to coordinate multiple parts of the app
const getFileHandle = (filepath: string) =>
  // @ts-ignore
  monitoredFiles.find((i) => i.filepath === filepath).handle




// WARNING: the other type of event is 'rename', always use the file handle to read or write to files since it doesn't care about the actual file path or if the file has been renamed.

// creates a watcher that auto updates the content of a file if it's modified
function startMonitorFile(filepath: string) {
  watcher.add(filepath)
  // const watcher = watch(filepath, (event, _) => {
  //   console.log(`Event type:`, event, _, filepath)
  //   if (event == 'change')
  //     loadFileContents(filepath)
  //   // else rename event
  // })

  const file_handle: PathOrFileDescriptor = openSync(filepath, 'r+')

  monitoredFiles.push({
    filepath: filepath,
    handle: file_handle,
  })

}



function loadFileContents(filepath: string) {
  const handle = getFileHandle(filepath)
  let stats = fstatSync(handle)
  const buffer = Buffer.alloc(stats.size)
  console.log(stats)

  readSync(
    handle,
    buffer, 0, // write from start of buffer
    stats.size, 0 // read from start of file
  )

  const data = buffer.toString('utf8')

  mainWindow.webContents.send('file_change', {
    filepath: filepath,
    text: data,
    title: parse(filepath).name
  })


} // NOTE: <--------- end of load File Contents ------>


// Save files to disk
export function writeFileContents(filepath: string, data) {
  console.log(filepath, data)
  const file_handle = getFileHandle(filepath)
  const num_bytes_written = writeSync(file_handle, data, 0, 'utf8') // overwrite data from start of file
  ftruncateSync(file_handle, num_bytes_written) // trim length of file
}


// TODO: saveCachedImage (filepath,  hash, svg data,)
//
// TODO: getCachedImage (filepath,  hash)
// return "" if not found



export function closeFile(filepath: string) {
  var to_close = monitoredFiles.find(i => i.filepath == filepath)
  monitoredFiles = monitoredFiles.filter(i => i.filepath != filepath) // remove file to close from monitored

  if (!to_close) return

  watcher.unwatch(filepath) // stop monitoring changes on this file

  closeSync(to_close.handle)

  console.log(monitoredFiles, to_close)
}
