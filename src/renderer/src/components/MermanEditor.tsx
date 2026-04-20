import { PrismEditor } from "prism-react-editor";
import CodeEditor from "./CodeEditor";
import { useEffect, useRef, useState } from "react";
import ContentHeight from "./dynamicSize";
import ConsoleOutput from "./Console";
import { ReferenceDisplay, ReferenceTopics } from "./ReferenceInfo";
import { FixedBar, SplitBottom, SplitLayout, SplitMain, SplitTop } from "./SplitViewLayout";




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

  const REFRESH = () => setInitText(
    ActiveFile.unsaved_text != "" ?
      ActiveFile.unsaved_text : ActiveFile.text
  )

  ref.current.reset = () => REFRESH() // refresh when autoreloading
  useEffect(() => REFRESH(), [ActiveFile]) // refresh when changing file tabs


  const divRef = useRef(null)

  useEffect(() => {
    divRef.current.scrollTop = ActiveFile.scroll_pos.merman.scroll
  }, [initText])

  const handleScroll = (_) =>
    ActiveFile.scroll_pos.merman.scroll = divRef.current.scrollTop

  const [showInfo, setShowInfo] = useState<string>('')

  const consoleRef = useRef<HTMLDivElement>(null)


  return (<>



    <SplitLayout
      mainContainerRef={divRef}
      handleMainScroll={handleScroll}
    >
      <FixedBar>
        <button
          onClick={saveFile}
          disabled={!unsavedChanges}>
          Save
        </button>
        <button
          onClick={saveAsFile}>
          Save As
        </button>
        <label class="switch">
          <input type="checkbox"
            onChange={toggleAutoRender}
            ref={autoRenderRef}
          />
          <span class="slider"></span>
        </label>
        Auto-Render
        {/*<button onClick={() => consoleRef.current.scrollTop = 100}>test</button>
        {/* <button >Verify</button>  {/* run code without rendering or preprocessor */}
      </FixedBar>
      <SplitTop>
        <ReferenceTopics
          activeFile={ActiveFile}
          setInfoAbout={setShowInfo}
          refreshEditor={REFRESH}
          editorRef={editorRef}
        />
      </SplitTop>

      <SplitBottom ref={consoleRef} >
        <ReferenceDisplay
          topic={showInfo}
          style={{ display: showInfo != '' ? 'block' : 'none' }}
        />
        <ConsoleOutput
          activeFile={ActiveFile}
          scrollToBottom={() => {
            if (consoleRef.current)
              consoleRef.current.scrollTop =
                consoleRef.current.scrollHeight
          }}
          takeFocus={() => setShowInfo('')}
          style={{ display: showInfo == '' ? 'block' : 'none' }}
        />
      </SplitBottom>

      <SplitMain>
        <CodeEditor
          type="merman"
          value={initText}
          ref={editorRef}
          onUpdate={textUpdated}
        />

      </SplitMain>


    </SplitLayout>



  </>)
}


