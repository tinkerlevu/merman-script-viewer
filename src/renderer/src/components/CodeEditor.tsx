
import Prism from 'prismjs'; // Hacky fix
// DEFAULTS
import { Editor, PrismEditor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"

// Adding the JSX grammar

// Adds comment toggling and auto-indenting for JSX
// import "prism-react-editor/languages/jsx"
import "prism-react-editor/layout.css"
// import "prism-react-editor/themes/prism.css"

// Required by the basic setup
import "prism-react-editor/search.css"
import "prism-react-editor/invisibles.css"
import { languages } from "prism-react-editor/prism"
import { RefObject } from "react"


// for some fucking reason this doesn't work in appimage, etc. build probs sth vite related
// import "prism-react-editor/prism/languages/javascript"


// CUSTOM HIGHLIGHTING
//

export const MermanLanguage = {
  'comment': /\/\/.*/,
  'string': /"(?:\\.|[^\\"])*"/,
  'keyword': /\b(if|else|while|return|custom_key|foo)\b/,
  'boolean': /\b(true|false)\b/,
  'operator': /[<>]=?|[!=]=?|&&|\|\||[-+*/%]/,
};


languages['merman'] = MermanLanguage
languages['javascript'] = Prism.languages.javascript // hacky fix


// import 'prismjs/components/prism-javascript';



export default function CodeEditor(
  { type, ref, value, onUpdate = () => { } }: {
    type: EditorType,
    ref?: RefObject<PrismEditor | null>,
    value: string
    onUpdate?: () => void
  }): React.JSX.Element {

  // setup editor stuff here
  //
  var highlighting = type === "javascript" ? 'javascript' : 'merman';
  if (!value) value = type == "merman" ? "Open a file using the *new tab* button on the tab bar ( top left )" : "Open a file to preview it"


  console.log("LANGUAGES", languages, Prism)

  return <>

    <Editor
      language={highlighting}
      value={value}
      ref={ref}
      onUpdate={onUpdate}
      readOnly={type == "javascript"}
    >
      <BasicSetup />
    </Editor>
  </>
}
