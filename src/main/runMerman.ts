import { loadPyodide } from "pyodide";
import { BrowserWindow } from "electron";
import { dirname, join } from "path";
import { is } from "@electron-toolkit/utils";

import { AssignedRenderWindow, FileID, Hash, ProcessedLine, ProcessorPrintout, RenderJob } from "./env";

// TODO: TEST THIS FILE PATH FOR PRODUCTION AND BUILD
import MERMAN_CODE_FILE from './python-merman/merman2.py?asset'
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
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

  const merman_script = merman_text.split(/\r?\n/) // TODO: rename to source

  const generated = await preprocess(
    merman_script, preprocessor, filepath)

  if (generated == "error") {
    update_render_status(filepath, 'failed')
    return
    // UI CONSOLE PRINT check Processed Tab for more details, and processed tab has full error dump on it along with any remaining console logs that got out
  }

  console_log(filepath, "> Finished")

  console.log('GENERATED', JSON.stringify(generated, null, 2)) // TODO: REMOVE
  // TODO: send generated to UI
  // TODO: convert generated to merman script

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


async function preprocess(
  merman_script: Array<string>,
  preprocessor_code: string,
  filepath_id: string,)
  : Promise<Array<ProcessedLine> | "error"> {

  console_log(filepath_id, "[ Initalizing Preprocessor ]")

  // NOTE: --- Processor Base variables ----
  const presistentData = {} // store variables that can be accessed in subsequent process line calls
  const line = {
    text: "", // the actual source line itself
    index: 0, // index of line in ALL array
    number: 1, // actual line number
    All: structuredClone(merman_script),
    END: merman_script.length,
    //last
    //next
  }

  // NOTE: --- Console.log override  ----
  var captured_logs: Array<ProcessorPrintout> = []
  const console_override = {
    log: (...args: any) => {
      captured_logs.push(array_toPrintout(args, 'plain'))
      console_log(filepath_id, args.join(' ')) // print to UI console
      console.log("REGULAR LOG >>", ...args)
    },
    html: (...args: any) => { // html table entry no UI console
      captured_logs.push(array_toPrintout(args, 'html'))
      console.log("HTML LOG >>", ...args)
    },
    push: (...args: any) => { // prints plain but not to console
      captured_logs.push(array_toPrintout(args, 'plain'))
    },
    throw: (...args: any) => {
      console_log(filepath_id, args.join(' ')) // print to UI console only
      console.log("QUIET LOG >>", ...args)
    }, //?? change name to temp? or lose or free
    // error: ???
  }

  // NOTE: --- helper functions  ----

  const analyzehf = await get_analyze_function()
  const readhf = (relpath: string) => readFileSync(
    join(dirname(filepath_id), relpath), 'utf8')
  const writehf = (relpath: string, contents: string, append = true) => {

    const path = join(dirname(filepath_id), relpath)
    mkdirSync(dirname(path), { recursive: true }) // autocreate missing dir
    writeFileSync(
      path, contents, { encoding: 'utf8', flag: append ? 'a' : 'w' })
  } // if append is false it will override



  // NOTE: --- create processor function  ----

  var runProcessor: any
  try {

    runProcessor = new Function(
      'line', 'PERSISTENT', 'console', 'ANALYZE', 'read', 'write',
      preprocessor_code + // keeps stack trace numbers accurate:
      "\n//# sourceURL=preprocessor-all-active-combined.js")

  } catch (err) {
    console_log(filepath_id, // print in UI console
      "======= ERROR =======\n" +
      "Error Creating Preprocessor code (Probably Syntax Error) " +
      dumpError(err))
    return "error"
  }


  // NOTE: --- run Processing ---

  console_log(filepath_id, "[ Running Preprocessor ]")

  const OUTPUT: Array<ProcessedLine> = []
  var gen_lnum = 1 // generated line number

  for (var lnum = 0; lnum < merman_script.length; lnum++) {
    line.text = merman_script[lnum]
    line.index = lnum
    line.number = lnum + 1


    // DOCUMENT: the ANALYZE("<merman text>"), read(<path relative to script location>), write(<path relative to script location>, contents)
    var raw_result: string = ""

    try { // Actually run the processor code
      raw_result = runProcessor(line, presistentData, console_override,
        analyzehf, readhf, writehf)
    } catch (err) {
      // handle output
      OUTPUT.push({
        source: merman_script[lnum],
        line_num: lnum + 1,
        printed: captured_logs,
        generated: [],
        error: {
          type: "preprocessor",
          message: dumpError(err)
        }
      })
      console_log(filepath_id, // print in UI console
        "======= ERROR =======\n" +
        "Preprocessing error on merman line: " + (lnum + 1) +
        '\n' + merman_script[lnum] + '\n' +
        dumpError(err))
      return "error"
    }


    // handle output
    const processed_result: ProcessedLine = {
      source: merman_script[lnum],
      line_num: lnum + 1,
      printed: captured_logs,
      generated: [],
      error: null
    }
    captured_logs = new Array() // reset for next iteration

    // TODO: throw error if result is not string or undefined
    if (raw_result != undefined) {
      processed_result.generated = raw_result
        .split(/\r?\n/).map(s => { // separete by newlines
          return {
            content: s,
            line_num: gen_lnum++  // make sure to increment lmao
          }
        })
    }
    else { // nothing returned from processor
      processed_result.generated = [{
        content: merman_script[lnum], // pass original line through
        line_num: gen_lnum++
      }]
    }
    // NOTE: ---- end of processing loop

    OUTPUT.push(processed_result)
  }
  console.log("captured logs", captured_logs)


  return OUTPUT
}



// Converts console.log input array to ProcessorPrintout objects
// html determines if printout type is html or plain text as is
function array_toPrintout
  (a: Array<any>, msg_type: ProcessorPrintout["type"])
  : ProcessorPrintout {
  return {
    content: a.map(// add more format args to inspect?
      a => typeof a === 'string' ? a : inspect(a)
    ).join(' '),
    type: msg_type
  }
}

async function get_analyze_function() {

  const MERMAN_CODE = readFileSync(MERMAN_CODE_FILE, 'utf8');
  const pyodide = await loadPyodide()

  return function(merman_line: string) {
    const locals = pyodide.toPy({
      // filedata: ['"hello" ^world *how &is !it! `going` !!!!! ((('],
      filedata: [merman_line],
      analyze_only: true
    }) // setup stuff here and set flag to analyze only

    try {
      const evaluated = pyodide.runPython(MERMAN_CODE, { locals })
      return evaluated.toJs()
    }
    catch (error) {
      console.log('ANALYZE ERROR', error) // TODO: remove
      return { ERROR: 'syntax error', line_type: 'ERROR' }
    }
  }

}



function dumpError(err) {
  var dump = ""
  if (typeof err === 'object') {
    if (err.message)
      dump += '\nMessage: ' + err.message
    if (err.stack)
      dump += '\nStacktrace:\n====================\n' + err.stack
  }
  else
    dump += 'dumpError :: argument is not an object'
  return dump
}
