import { loadPyodide } from "pyodide";
import { BrowserWindow } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

import { AssignedRenderWindow, FileID, Hash, RenderJob } from "./env";

// TODO: TEST THIS FILE PATH FOR PRODUCTION AND BUILD
import MERMAN_CODE_FILE from './python-merman/merman2.py?asset'
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { inspect } from "util";


var mainWindow: BrowserWindow // very hacky ikik

export const setupMermaidRenderer = (mainInterface: BrowserWindow) =>
  mainWindow = mainInterface



// NOTE: this is where all the currently open mermaid render windows are
var runningRenderWindows: Array<AssignedRenderWindow> = []


var currentRender: RenderJob = {
  text: "",
  filepath_id: "",
  timestamp: performance.now(),
  preprocessor: ""
}


// --------------- UTIL funtions
const send_hash = (filepath: FileID, hash: Hash) =>
  mainWindow.webContents.send('new_render_hash', {
    filepath: filepath,
    hash: hash,
  })

const update_render_status = (filepath: FileID, status: string) =>
  mainWindow.webContents.send('new_render_status', {
    filepath: filepath,
    status: status,
  })

const console_log = (filepath: FileID, newline: string) =>
  mainWindow.webContents.send('console_log', {
    filepath_id: filepath,
    text: newline + '\n',
    id: Math.random().toString(36).substring(2) // DO NOT REMOVE makes sure each line stored in active file is unique. otherwise duplicate printouts would be filtered out even if they're supposed to be shown
  })

const console_clear = (filepath: FileID) =>
  mainWindow.webContents.send('console_clear', {
    filepath_id: filepath,
  })


// --------- MAIN RENDER SEQUENCE

export default async function full_render(
  filepath: string,
  merman_text: string, // one single string that hasn't been broken into an array
  preprocessor: string,

) {
  console.log("PREPROCESSOR", preprocessor)

  // deal with multiple triggers from rapid file saves
  if (merman_text == currentRender.text
    && filepath == currentRender.filepath_id
    && preprocessor == currentRender.preprocessor) {
    // debouncing on abort messages
    if (performance.now() - currentRender.timestamp < 500) {
      currentRender.timestamp = performance.now()
      return
    }
    currentRender.timestamp = performance.now()
    console_log(filepath, "> No changes since last render - ABORTING")
    return
  }
  currentRender = {
    text: merman_text,
    filepath_id: filepath,
    timestamp: performance.now(),
    preprocessor: preprocessor
  }

  // Update UI
  console_clear(filepath)
  console_log(filepath, "--- Starting render process ---")
  update_render_status(filepath, 'running')
  send_hash(filepath, "pending")


  closeExisting(filepath) // cancel previous render job

  const merman_script = merman_text.split(/\r?\n/)

  const [generated] = preprocess(merman_script, preprocessor, filepath)
  console.log(generated)

  // preprocessor returns table which indicates original filenumber, preprocessed file number, and the corresponding line output and only console output from the function, that can be mapped onto a table

  const mermaid = await translate_merman(
    merman_script,
    (t: string) => console_log(filepath, t) // send stuff to the console component in the renderer
  )

  if (mermaid == '') { // Translation failed Error in script
    console.log("===== THROWING ERROR =====")
    update_render_status(filepath, 'failed')
    //TODO: indicate failing (generated) line number in the processed table UI Tab with <!> warning tab icon
    //TODO: show actual line number in processed table
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

export function handleFinishedRender(_, data): void {
  mainWindow.webContents.send('new_render', data)
  console_log(data.filepath, data.type + " - COMPLETE")
}


export function handleAllRendersFinished(filepath_id: string) {
  closeExisting(filepath_id)
  update_render_status(filepath_id, 'done')
}


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
      //: that this is how to pass args before init
      // additionalArguments: ['--maxMermaidChars=69420'],
    }
  })
  // enable this to show the window
  // renderWindow.on('ready-to-show', () => renderWindow.show())


  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    renderWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/mermaid_render_index.html')
  } else {
    renderWindow.loadFile(join(__dirname, '../renderer/mermaid_render_index.html'))
  }

  return renderWindow;
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


//
// NOTE: ----------- PREPROCESSOR STUFF --------------
//


function preprocess(
  merman_script: Array<string>,
  preprocessor_code: string,
  filepath_id: string): Array<any> {


  // for the script to store variables that can be accessed in subsequent calls
  const presistentData = {}
  const line = {
    text: "", // the actual source line itself
    index: 0, // index of line in ALL array
    number: 1, // actual line number
    All: structuredClone(merman_script),
    END: merman_script.length,
    //analyze()
    //last
    //next
  }

  const capturedLogs: Array<Array<string>> = []
  const any_toString = (a: any) => inspect(a,) // TODO: add options here?
  const console_override = {
    log: function(...args: any) {
      // TODO: add html, load, temp methods, and send console outputs to UI and print to console.
      capturedLogs.push(args.map(i => any_toString(i)));
    }
  }

  const Process =
    new Function(
      'line', 'PERSISTENT', 'console',
      preprocessor_code)

  for (var lnum = 0; lnum < merman_script.length; lnum++) {
    line.text = merman_script[lnum]
    line.index = lnum
    line.number = lnum + 1

    var raw_result_string =
      Process(line, presistentData, console_override)

    console.log('PROCESSING RESULT', raw_result_string, capturedLogs.join('\n'))

    // TODO: handle result, convert to array, add to script, calculate line mapping table, convert to ProcessedLine
    // TODO: if null just pass along existing merman line
    // add '/n' to end of line if not existing? or strip it? '"hello world"' \n\n
  }


  return []
}


// TODO: REMOVE:
//
// const stringifyAll = (obj) => {
//   const cache = new WeakSet(); // To handle circular references
//   return JSON.stringify(obj, (_, value) => {
//     // 1. Handle Circular References
//     if (typeof value === "object" && value !== null) {
//       if (cache.has(value)) return "[Circular]";
//       cache.add(value);
//     }
//     // 2. Handle Functions
//     if (typeof value === "function") return value.toString();
//     // 3. Handle Map and Set
//     if (value instanceof Map) return Object.fromEntries(value.entries());
//     if (value instanceof Set) return Array.from(value);
//     // 4. Handle BigInt
//     if (typeof value === "bigint") return value.toString() + "n";
//     // 5. Handle RegExp
//     if (value instanceof RegExp) return value.toString();
//
//     return value;
//   }, 2); // Pretty print with 2 spaces
// };

// (function() {
//     // 1. Store the original reference
//     const oldLog = console.log;
//
//     // 2. Redefine the log function
//     console.log = function(...args) {
//         // Capture the output (e.g., store in an array or send to a server)
//         console.capturedLogs = console.capturedLogs || [];
//         console.capturedLogs.push(args);
//
//         // 3. Call the original log to ensure it still prints to the console
//         oldLog.apply(console, args);
//     };
// })();
//
// // Usage:
// console.log("Hello World!");
// console.log("Second message", { data: 123 });
//
// // Access captured logs:
// console.table(console.capturedLogs);
