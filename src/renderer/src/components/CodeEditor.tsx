// DEFAULTS

import { Editor, PrismEditor } from "prism-react-editor"
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
import { RefObject } from "react"



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
  { type, ref, value, onUpdate }: {
    type: EditorType,
    ref: RefObject<PrismEditor | null>,
    value: string
    onUpdate: () => void
  }): React.JSX.Element {

  // setup editor stuff here
  //
  var highlighting = type === "javascript" ? 'javascript' : 'merman';
  if (!value) value = "var foo = bar"



  return <Editor
    language={highlighting}
    value={value}
    ref={ref}
    onUpdate={onUpdate}
  >
    <BasicSetup />
  </Editor>
}
