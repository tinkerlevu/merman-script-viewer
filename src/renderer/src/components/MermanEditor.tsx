import { PrismEditor } from "prism-react-editor";
import CodeEditor from "./CodeEditor";
import { useRef, useState } from "react";




export default function MermanEditor(
  { ActiveFile, ref }: {
    ActiveFile: OpenFile,
    ref: any // supposed to be a ref object idk
  }): React.JSX.Element {
  const editorRef = useRef<PrismEditor>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const saveFile = () => {
    window.electron.ipcRenderer.send('save_file', {
      filepath: ActiveFile.filepath,
      text: editorRef.current?.value // recommended way to get editor state
    })
  }

  const textUpdated = () => {
    if (editorRef.current?.value == ActiveFile.text)
      setUnsavedChanges(false)
    else
      setUnsavedChanges(true)
  }

  ref.current.get_text = () => editorRef.current?.value



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
      value={ActiveFile.text}
      ref={editorRef}
      onUpdate={textUpdated}
    />
  </>)
}
