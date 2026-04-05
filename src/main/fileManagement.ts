import { BrowserWindow, dialog, ipcMain } from "electron"
import { extname, parse } from "path"
import { existsSync, readFile, watch, writeFileSync, open, readFileSync, openSync, fstatSync, PathOrFileDescriptor, readSync, writeSync, ftruncateSync } from "fs"
import { MonitoredFile } from "./env"

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

  if (pathSelection.canceled) return

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
}


// WARNING: make sure there is always corresponding filepath in monitoredFiles
var monitoredFiles: Array<MonitoredFile> = [] // all files with fs.Watch applied to them

// filepath is used as an id to coordinate multiple parts of the app
const getFileHandle = (filepath: string) =>
  // @ts-ignore
  monitoredFiles.find((i) => i.filepath === filepath).handle




// WARNING: the other type of event is 'rename', always use the file handle to read or write to files since it doesn't care about the actual file path or if the file has been renamed.

// creates a watcher that auto updates the content of a file if it's modified
function startMonitorFile(filepath: string) {

  const watcher = watch(filepath, (event, _) => {
    console.log(`Event type:`, event, _, filepath)
    if (event == 'change')
      loadFileContents(filepath)
    // else rename event
  })

  const file_handle: PathOrFileDescriptor = openSync(filepath, 'r+')

  monitoredFiles.push({
    filepath: filepath,
    handle: file_handle,
    watcher: watcher
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

  console.log('sending to renderer')
  mainWindow.webContents.send('file_change', {
    filepath: filepath,
    text: data,
    title: parse(filepath).name
  })



  // TODO:  loadFileContents(filepath)
  // add md5 hash and image cacheing here
  // send IPC
  // (just use dir from filepath for caching, don't worry about renaming)

  // readFile(getFileHandle(filepath), 'utf8', (err, data) => {
  //   console.log(err)
  //   if (err)
  //     return console.error(err); // leave this log here unless proper error indication system is created
  //   console.log("UPDATING file", data)
  // });


} // NOTE: <--------- end of load File Contents ------>


// Save files to disk
export function writeFileContents(filepath: string, data) {
  console.log(filepath, data)
  const file_handle = getFileHandle(filepath)
  const num_bytes_written = writeSync(file_handle, data, 0, 'utf8') // overwrite data from start of file
  ftruncateSync(file_handle, num_bytes_written) // trim length of file
}


// TODO: saveCachedImage (filepath,  hash, svg data,)



// TODO: stop monitoring file
// setup ipc in main
// find item in array using filepath
// deactivate watcher
// remove item from array
// run fs.closeSync(getFileHandle(filepath))
