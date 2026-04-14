import { PrismEditor } from "prism-react-editor";
import CodeEditor from "./CodeEditor";
import { act, useEffect, useRef, useState } from "react";
import ContentHeight from "./dynamicSize";




export default function MermanEditor(
  { ActiveFile, ref, setSavedIcon }: {
    ActiveFile: OpenFile,
    ref: any, // supposed to be a ref object idk
    setSavedIcon: (b: boolean) => void
  }): React.JSX.Element {
  const editorRef = useRef<PrismEditor>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const saveFile = () => { // savefile Button
    window.electron.ipcRenderer.send('save_file', {
      filepath: ActiveFile.filepath,
      text: editorRef.current?.value // recommended way to get editor state
    })
    // ActiveFile.text = editorRef.current?.value // recommended way to get editor state
    // setUnsavedChanges(false)
  }

  const saveAsFile = () => {
    window.electron.ipcRenderer.send('save_as_file', {
      filepath: ActiveFile.filepath,
      text: editorRef.current?.value // recommended way to get editor state
    })
  }

  const textUpdated = () => {
    if (editorRef.current?.value == ActiveFile.text) {
      setUnsavedChanges(false)
      setSavedIcon(true)
    }
    else {
      setUnsavedChanges(true)
      setSavedIcon(false)
    }
    ActiveFile.unsaved_text = editorRef.current?.value
  }


  const autoRenderRef = useRef(null)

  useEffect(() => { // set current state of checkbox
    autoRenderRef.current.checked = ActiveFile.auto_render || false
  }, [ActiveFile])

  const toggleAutoRender = () =>
    ActiveFile.auto_render = autoRenderRef.current.checked


  ref.current.get_text = () => editorRef.current?.value // function that parent components can use to access editor value


  const container_style = {
    height: ContentHeight(),
  }

  const [initText, setInitText] = useState<string>("")

  const setInit = () => setInitText(
    ActiveFile.unsaved_text != "" ?
      ActiveFile.unsaved_text : ActiveFile.text
  )

  ref.current.reset = () => setInit() // refresh when autoreloading
  useEffect(() => setInit(), [ActiveFile]) // refresh when changing file tabs


  const divRef = useRef(null)

  useEffect(() => {
    divRef.current.scrollTop = ActiveFile.scroll_pos.merman.scroll
  }, [initText])

  const handleScroll = (_) =>
    ActiveFile.scroll_pos.merman.scroll = divRef.current.scrollTop


  return (<>

    <div className="FixedContainer">
      {/*<input type="checkbox" />Auto-Refresh ah have autorefresh on at all times!! */}
      <input type="checkbox"
        onChange={toggleAutoRender}
        ref={autoRenderRef}
      /> Auto-Render
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
      <div
        style={{ width: "30%", display: 'inline-block' }}
      >
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
      <div
        style={{
          height: '100%',
          width: "70%",
          display: 'inline-block',
          overflow: 'scroll'
        }}
        ref={divRef}
        onScroll={handleScroll}
      >
        <CodeEditor
          type="merman"
          value={initText}
          ref={editorRef}
          onUpdate={textUpdated}
        />
      </div>


    </div>
  </>)
}


// insert function def for the reference panel
