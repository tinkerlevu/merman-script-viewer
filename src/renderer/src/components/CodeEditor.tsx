// DEFAULTS

import { Editor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

// Adding the JSX grammar
import "prism-react-editor/prism/languages/javascript"

// Adds comment toggling and auto-indenting for JSX
import "prism-react-editor/languages/jsx"

import "prism-react-editor/layout.css"
import "prism-react-editor/themes/github-dark.css"

// Required by the basic setup
import "prism-react-editor/search.css"
import "prism-react-editor/invisibles.css"
import { languages } from "prism-react-editor/prism"



// CUSTOM HIGHLIGHTING
//

const MermanLanguage = {
  'comment': /\/\/.*/,
  'string': /"(?:\\.|[^\\"])*"/,
  'keyword': /\b(if|else|while|return|custom_key|foo)\b/,
  'boolean': /\b(true|false)\b/,
  'operator': /[<>]=?|[!=]=?|&&|\|\||[-+*/%]/,
};


languages['merman'] = MermanLanguage







export default function CodeEditor(
  { type }: { type: EditorType }
): React.JSX.Element {

  console.log(languages)
  // setup editor stuff here
  //
  var highlighting = type === "javascript" ? 'javascript' : 'merman';



  return <Editor language={highlighting} value="const foo = 'bar'">
    <BasicSetup />
  </Editor>
}
