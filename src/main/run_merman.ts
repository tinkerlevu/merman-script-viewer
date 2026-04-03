import { loadPyodide, toPy } from "pyodide";
import { json } from "stream/consumers";




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
  const json_string = JSON.stringify(test_merman)
  const mermaid = await translate_merman(test_merman)

  console.log(mermaid)

}


// params are the merman text and  a function to send updates to the terminal window on the interface, and a function to return the results

// json string has to be an array, where each entry is each line in the file, but it's a single string
async function translate_merman(file_lines) {
  const pyodide = await loadPyodide();
  const locals = pyodide.toPy({ filedata: file_lines })
  return pyodide.runPython(test_code, { locals })
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


