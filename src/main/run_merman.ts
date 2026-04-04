import { loadPyodide, toPy } from "pyodide";
import { BrowserWindow, IpcMainEvent } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

import { AssignedRenderWindow } from "./env";

// TODO: TEST THIS FILE PATH FOR PRODUCTION AND BUILD
import MERMAN_CODE_FILE from './python-merman/merman2.py?asset'

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
// NOTE: this is where all the currently open mermaid render windows are
var runningRenderWindows: Array<AssignedRenderWindow> = []




export default async function full_render() {
  const mermaid = await translate_merman(test_merman)

  // TODO: check if mermaid translation is successful before starting this create render window

  const renderWindow = createRenderWindow()

  renderWindow.webContents.on('did-finish-load', () => {
    // IPC comms here
    // TODO: add mmd_filepath to mermaid stuff? or to browserwindow preload?
    renderWindow.webContents.send('start_render', mermaid)
    console.log(mermaid)
  })


  runningRenderWindows.push({
    bWindow: renderWindow,
    mmn_filepath: "test" // TODO: replace with proper filepath
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
      // TODO: adjust this number to largest file length
      additionalArguments: ['--maxMermaidChars=69420'],
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


export function handleFinishedRender(event, data): void {
  console.log("EVENT", event)
  console.log("DATA", data)
}



export async function hello_python() {
  const pyodide = await loadPyodide();
  console.log(pyodide.runPython("1 + 2"));
  // 3

  const globals = pyodide.toPy({ x: 3 });
  console.log(pyodide.runPython("x + 1", { globals }));
  // 4

  const locals = pyodide.toPy({ arr: [1, 2, 3] });
  console.log(pyodide.runPython("sum(arr)", { locals }));
  // 6
}


