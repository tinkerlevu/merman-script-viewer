import { PrismEditor } from "prism-react-editor";
import CodeEditor from "./CodeEditor";
import { useEffect, useRef, useState } from "react";
import ContentHeight from "./dynamicSize";




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

  const saveAsFile = () => {
    window.electron.ipcRenderer.send('save_as_file', {
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


  const container_style = {
    height: ContentHeight(),
  }

  return (<>

    <div className="FixedContainer">
      {/*<input type="checkbox" />Auto-Refresh ah have autorefresh on at all times!! */}
      <input type="checkbox" />Auto-Render
      <button
        onClick={saveFile}
        disabled={!unsavedChanges}>
        Save
      </button>
      <button
        onClick={saveAsFile}>
        Save As
      </button>
      <button >Verify</button>  {/* run code without rendering or preprocessor */}
      ! unsaved changes !  {/*TODO: Change this to disable enable save button when editor on change is run */}
      error tab that also displays docs for merman syntax
    </div>

    <div style={container_style}>
      <div style={{
        width: "30%",
        display: 'inline-block'
      }}>
        <div style={{ height: ContentHeight() / 2, display: 'block' }}>
          select reference

          you have general section topics like --Branching--, --Node Shapes--
          which either inserts no examples or an example comment

          and specific topics like :
          Trapezoid
          Rhombus

          {/*clicking on each topic will insert one or more lines of text separately to show an example*/}
        </div>
        <div style={{ display: 'block' }}>
          sample or debug text
          also includes simple images like for showing node shapes
        </div>
      </div>
      <div style={{
        height: '100%',
        width: "70%",
        display: 'inline-block',
        overflow: 'scroll'
      }}>
        <CodeEditor
          type="merman"
          value={ActiveFile.text}
          ref={editorRef}
          onUpdate={textUpdated}
        />
      </div>


    </div>
  </>)
}


// insert function def for the reference panel
