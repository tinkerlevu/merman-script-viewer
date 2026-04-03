import { loadPyodide, toPy } from "pyodide";
//
// TODO TEST THIS FILE PATH FOR PRODUCTION AND BUILD
import MERMAN_CODE_FILE from './python-merman/merman2.py?asset'

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


export default async function full_render() {
  const mermaid = await translate_merman(test_merman)

  console.log(mermaid)

  console.log("finished")
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


