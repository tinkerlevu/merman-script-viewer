import { PrismEditor } from "prism-react-editor";
import CodeEditor from "./CodeEditor";
import { useRef, useState } from "react";



export default function MermanEditor(): React.JSX.Element {
  const editorRef = useRef<PrismEditor>(null);
  const [writeValue, setWriteValue] = useState("var foo = bar")
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const saveFile = () => {
    setUnsavedChanges(false)
    console.log(editorRef.current?.value) // recommended way to get editor state
    setWriteValue("test") // overwrite current value of editor
  }





  return (<>
    {/*<input type="checkbox" />Auto-Refresh ah have autorefresh on at all times!! */}
    <input type="checkbox" />Auto-Render
    <button
      onClick={saveFile}
      disabled={!unsavedChanges}>
      Save
    </button>
    <button >Save As</button>
    <button >Verify</button>  {/* run code without rendering or preprocessor */}
    ! unsaved changes !  {/*TODO: Change this to disable enable save button when editor on change is run */}
    error tab that also displays docs for merman syntax
    <CodeEditor
      type="merman"
      value={writeValue}
      ref={editorRef}
      onUpdate={() => { setUnsavedChanges(true) }}
    />
  </>)
}
