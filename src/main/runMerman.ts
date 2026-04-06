import { loadPyodide, toPy } from "pyodide";
import { BrowserWindow, IpcMainEvent } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

import { AssignedRenderWindow } from "./env";

// TODO: TEST THIS FILE PATH FOR PRODUCTION AND BUILD
import MERMAN_CODE_FILE from './python-merman/merman2.py?asset'
import { createHash } from "crypto";


var mainWindow: BrowserWindow // very hacky ikik

export const setupMermaidRenderer = (mainInterface: BrowserWindow) =>
  mainWindow = mainInterface



// NOTE: this is where all the currently open mermaid render windows are
var runningRenderWindows: Array<AssignedRenderWindow> = []




export default async function full_render(
  filepath: string,
  merman_text: string // one single string that hasn't been broken into an array
) {

  const merman_script = merman_text.split(/\r?\n/)

  // TODO: Preprocessor stuff here? or handle it in renderer?
  // to include files have to do it here
  // TODO: WARNING: the preprocessor might return stuff as a single string separated by \n with \\n in the text. Might have to unpack those strings into arrays and add that to the main array
  // TODO: have a separate debug window that pops up which shows the file output and while line caused the error and which lines were modified by the preprocessor and what the preprocessor actually returned.
  //mb run the entire script again? or not if the preprocessor can use random values
  // preprocessor returns table which indicates original filenumber, preprocessed file number, and the corresponding line output that can be mapped onto a table with no borders and displayed in a separate window

  // TODO: update rendering status if failed or successful in renderer

  const mermaid = await translate_merman(merman_script)

  // TODO: check if mermaid translation is successful or report error
  console.log(mermaid)

  const hash = createHash('md5').update(mermaid.script.join('')).digest('base64url')

  // TODO: check if cached image exists
  // todo: only save X most recent images as cache

  const renderWindow = createRenderWindow()

  renderWindow.webContents.on('did-finish-load', () => {
    // IPC comms here
    renderWindow.webContents.send('start_render', {
      mermaid: mermaid,
      filepath: filepath,
      hash: hash
    })
  })

  runningRenderWindows.push({
    bWindow: renderWindow,
    mmn_filepath: filepath
  })

}


// params are the merman text and  a function to send updates to the terminal window on the interface, and a function to return the results

// json string has to be an array, where each entry is each line in the file, but it's a single string
async function translate_merman(file_lines) {
  const fs = require('fs')
  const MERMAN_CODE = fs.readFileSync(MERMAN_CODE_FILE, 'utf8');

  const pyodide = await loadPyodide();
  const locals = pyodide.toPy({ filedata: file_lines })
  const evaluated = pyodide.runPython(MERMAN_CODE, { locals })

  return evaluated.toJs()
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

  // TODO: remove this
  renderWindow.on('ready-to-show', () => {
    renderWindow.show()
  })


  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    renderWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/mermaid_render_index.html')
  } else {
    renderWindow.loadFile(join(__dirname, '../renderer/mermaid_render_index.html'))
  }


  // TODO: remove this
  console.log("new Render window id:", renderWindow.webContents.id)

  return renderWindow;
}


export function handleFinishedRender(_, data): void {
  console.log("Image DATA", data)
  mainWindow.webContents.send('new_rendered_image', data)
}




// TODO: remove
const test_code = `
s = "hello world potato"
s
print(filedata)
`
const test_merman = [
  'why: "hi here" !my_ID',
  '',
  '',
  'special: "node with \n pointers" ^terminating non_terminating&',
  '',
  'special: "node with references" *reference1 *reference2',
]

const test_render_data = {
  script: [
    'graph TD\n',
    'my_ID("hi here<br>"):::why\n',
    '_4("node with <br> pointers<br>"):::special\n',
    '_6("node with references<br>"):::special\n',
    'my_ID==> _4;\n',
    '_4 ==> terminating; _4 ==> non_terminating;\n',
    'reference1 ==> _6 ;;reference2 ==> _6;;\n'
  ],
}


