import { loadPyodide } from "pyodide";
import { BrowserWindow } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

import { AssignedRenderWindow, RenderJob } from "./env";

// TODO: TEST THIS FILE PATH FOR PRODUCTION AND BUILD
import MERMAN_CODE_FILE from './python-merman/merman2.py?asset'
import { createHash } from "crypto";
import { readFileSync } from "fs";


var mainWindow: BrowserWindow // very hacky ikik

export const setupMermaidRenderer = (mainInterface: BrowserWindow) =>
  mainWindow = mainInterface



// NOTE: this is where all the currently open mermaid render windows are
var runningRenderWindows: Array<AssignedRenderWindow> = []


var currentRender: RenderJob = {
  text: "",
  filepath_id: "",
  request_id: "",
  timestamp: performance.now()
}


// --------------- UTIL funtions
const send_hash = (filepath, hash) =>
  mainWindow.webContents.send('new_render_hash', {
    filepath: filepath,
    hash: hash,
  })

const update_render_status = (filepath, status) =>
  mainWindow.webContents.send('new_render_status', {
    filepath: filepath,
    status: status,
  })

const console_log = (filepath, newline) =>
  mainWindow.webContents.send('console_log', {
    filepath_id: filepath,
    text: newline + '\n',
    id: Math.random().toString(36).substring(2) // DO NOT REMOVE makes sure each line stored in active file is unique. otherwise duplicate printouts would be filtered out even if they're supposed to be shown
  })

const console_clear = (filepath) =>
  mainWindow.webContents.send('console_clear', {
    filepath_id: filepath,
  })


// ---------

export default async function full_render(
  filepath: string,
  merman_text: string, // one single string that hasn't been broken into an array
  request_id: string
) {
  console.log(request_id)

  if (request_id == currentRender.request_id) // filter out ipc noise
    return

  // TODO: update repeat trigger prevention to include the preprocessor and mb add a cooldown timeout?
  if (merman_text == currentRender.text
    && filepath == currentRender.filepath_id) { // multiple triggers from file saves
    if (performance.now() - currentRender.timestamp < 500) { // 500ms debouncing
      currentRender.timestamp = performance.now()
      return
    }
    currentRender.timestamp = performance.now()
    console_log(filepath, "> No changes since the last render - ABORTING")
    return
  }

  console_clear(filepath)
  console_log(filepath, "--- Starting render process ---")

  update_render_status(filepath, 'running')
  send_hash(filepath, "pending")

  currentRender = {
    text: merman_text,
    filepath_id: filepath,
    request_id: request_id,
    timestamp: performance.now()
  }
  closeExisting(filepath) // cancel previous render job

  const merman_script = merman_text.split(/\r?\n/)

  // TODO: Preprocessor stuff here

  // TODO: WARNING: the preprocessor might return stuff as a single string separated by \n with \\n in the text. Might have to unpack those strings into arrays and add that to the main array

  // preprocessor returns table which indicates original filenumber, preprocessed file number, and the corresponding line output and only console output from the function, that can be mapped onto a table

  const mermaid = await translate_merman(
    merman_script,
    (t: string) => console_log(filepath, t) // send stuff to the console component in the renderer
  )

  // TODO: report any errors to renderer

  if (mermaid == '') { // Translation failed Error in script
    console.log("===== THROWING ERROR =====")
    update_render_status(filepath, 'failed')
    return
  }

  console_log(filepath, "- Translation successful")

  const hash = createHash('md5').update(mermaid.script.join('')).digest('base64url')
  send_hash(filepath, hash)

  handleFinishedRender(null, { // send over TODO report
    filepath: filepath,
    hash: hash,
    type: 'todo',
    text: mermaid.todo.join('')
  })


  handleFinishedRender(null, { // send over Remember report
    filepath: filepath,
    hash: hash,
    type: 'remember',
    text: mermaid.remember.join('')
  })


  // TODO: check if cached image exists
  // todo: only save X most recent images as cache
  // todo: put this function as something separate so that it can be trigged on file open?

  console_log(filepath, " --- Rendering Graphs --- ")
  const renderWindow = createRenderWindow()


  console_log(filepath, "[ Created Rendering Window ]")

  renderWindow.webContents.on('did-finish-load', () => {
    // IPC comms here
    renderWindow.webContents.send('start_render', {
      mermaid: mermaid,
      filepath: filepath,
      hash: hash
    })
  })

  console_log(filepath, "[ Graph Rendering Started ]")

  runningRenderWindows.push({
    bWindow: renderWindow,
    mmn_filepath: filepath
  })

}

export function handleAllRendersFinished(filepath_id: string) {
  closeExisting(filepath_id)
  update_render_status(filepath_id, 'done')
}

// close any existing browser windows
async function closeExisting(filepath_id: string) {
  runningRenderWindows = runningRenderWindows.filter(i => {
    if (i.mmn_filepath == filepath_id) {
      i.bWindow.close()
      return false // remove from array
    }
    return true // keep in array
  })

}

// params are the merman text and  a function to send updates to the terminal window on the interface, and a function to return the results

// json string has to be an array, where each entry is each line in the file, but it's a single string
async function translate_merman(file_lines, print) {
  print('[ Initalizing Merman ]')

  const MERMAN_CODE = readFileSync(MERMAN_CODE_FILE, 'utf8');

  const pyodide = await loadPyodide({
    // TODO: add ipc for sending python print output to interface RENDER_LOG
    stdout: (text) => {
      console.log("PYTHON MERMAN PRINT", text)
      print(text)
    }
  });

  const locals = pyodide.toPy({ filedata: file_lines })
  try {
    const evaluated = pyodide.runPython(MERMAN_CODE, { locals })
    return evaluated.toJs()
  }
  catch (error) { // the Python code itself can throw errors to here if there's issues with the script
    console.log('MERMAN PYTHON ERROR', error)
    // TODO: map generated line number to source line number when preprocessor implemented
    return ''
  }

}


function createRenderWindow(): BrowserWindow {
  const renderWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // NOTE: that this is how to pass args before init, might not be necessary
      // additionalArguments: ['--maxMermaidChars=69420'],
    }
  })

  // enable this to show the window
  // renderWindow.on('ready-to-show', () => {
  //   renderWindow.show()
  // })


  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    renderWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/mermaid_render_index.html')
  } else {
    renderWindow.loadFile(join(__dirname, '../renderer/mermaid_render_index.html'))
  }

  return renderWindow;
}


export function handleFinishedRender(_, data): void {
  mainWindow.webContents.send('new_render', data)
  console_log(data.filepath, data.type + " - COMPLETE")
}



//
// // TODO: remove
// const test_code = `
// s = "hello world potato"
// s
// print(filedata)
// `
// const test_merman = [
//   'why: "hi here" !my_ID',
//   '',
//   '',
//   'special: "node with \n pointers" ^terminating non_terminating&',
//   '',
//   'special: "node with references" *reference1 *reference2',
// ]
//
// const test_render_data = {
//   script: [
//     'graph TD\n',
//     'my_ID("hi here<br>"):::why\n',
//     '_4("node with <br> pointers<br>"):::special\n',
//     '_6("node with references<br>"):::special\n',
//     'my_ID==> _4;\n',
//     '_4 ==> terminating; _4 ==> non_terminating;\n',
//     'reference1 ==> _6 ;;reference2 ==> _6;;\n'
//   ],
// }
//

