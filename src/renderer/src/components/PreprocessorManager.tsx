import { useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import { FixedBar, SplitBottom, SplitLayout, SplitMain, SplitTop } from "./SplitViewLayout";
import ConsoleOutput from "./Console";


const loadedScripts = new Map<FileID, string>()

export default function PreprocessorManager(
  { activeFile }: {
    activeFile: OpenFile
  }): React.JSX.Element {


  const containerRef = useRef(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  const openProcessorScript = () => {
    window.electron.ipcRenderer.send('preprocessor_open')
  }


  useEffect(() => {

    window.electron.ipcRenderer.on("preprocessor_load", (_, data) => {
      console.log(data)

    })
  }, [])

  return <SplitLayout
    mainContainerRef={containerRef}
    handleMainScroll={() => { }}
  >

    <FixedBar>
      <button onClick={openProcessorScript}>Open</button>
      <button >Dry Run</button>
    </FixedBar>

    <SplitTop>
      file selector
      <ul>
        <li>
          <input type="checkbox" />
          filename
          <button>🔼</button>
          <button>🔽</button>
          <button>X</button>
        </li>
      </ul>
    </SplitTop>

    <SplitBottom ref={consoleRef}>
      console
      <ConsoleOutput
        activeFile={activeFile}
        scrollToBottom={() => {
          if (consoleRef.current)
            consoleRef.current.scrollTop =
              consoleRef.current.scrollHeight
        }}
        takeFocus={() => { }}
        style={{}}
      />


    </SplitBottom>

    <SplitMain>
      <CodeEditor type="javascript"
        value={""}
        onUpdate={() => { }}
      />

      implement file loading into map and show contents here
    </SplitMain>


  </SplitLayout >
}



// runs function which passes an object as variable STATIC to be called over multiple lines!
// a single preprocessor file can be linked to multiple open scripts
// list of open preprocessor files that can be assigned to this file with -None- / default option
