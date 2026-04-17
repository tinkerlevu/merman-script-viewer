import { RefObject, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import { FixedBar, SplitBottom, SplitLayout, SplitMain, SplitTop } from "./SplitViewLayout";
import ConsoleOutput from "./Console";



export default function PreprocessorManager(
  { activeFile }: {
    activeFile: OpenFile
  }): React.JSX.Element {

  const [loadedScripts, setLoadedScripts] = useState<Map<FileID, string>>(new Map())

  const containerRef = useRef(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  const openProcessorScript = () => {
    window.electron.ipcRenderer.send('preprocessor_open')
  }

  const [currentFile, setCurrentFile] = useState<string>('')

  useEffect(() => {
    window.electron.ipcRenderer.on("preprocessor_load", (_, data) => {
      setLoadedScripts(
        // structed clone is needed to retrigger rerendering in use effect, etc.
        prev => structuredClone(prev)
          .set(data.filepath, data.text))
    })
  }, [])

  useEffect(() => {
    setCurrentFile(JSON.stringify(Object.fromEntries(loadedScripts)))
  }, [loadedScripts])


  return <SplitLayout
    mainContainerRef={containerRef}
    handleMainScroll={() => { }}
  >

    <FixedBar>
      <button onClick={openProcessorScript}>Open</button>
      <button >Dry Run</button>
      <button onClick={() => console.log(loadedScripts, currentFile,)}>Test </button>
    </FixedBar>

    <SplitTop>
      <ScriptManager
        scripts={loadedScripts}
      />
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

      <p>{currentFile}</p>
    </SplitMain>


  </SplitLayout >
}





function ScriptManager({ scripts }: {
  scripts: Map<FileID, string>
}): React.JSX.Element {
  const [fileOrder, setFileOrder] = useState<Array<string>>([])
  const [displayItems, setDisplayItems] = useState<Array<any>>([])
  const activeScripts = new Set<string>()



  useEffect(() => {
    var additions: Array<string> = []

    for (const file of scripts.keys())
      if (!fileOrder.includes(file))
        additions.push(file)

    setFileOrder(prev => [...prev, ...additions])
  }, [scripts])


  useEffect(() => { // re-render the file items
    var list: Array<any> = []
    for (const [i, path] of fileOrder.entries()) {
      list.push(
        <li key={path}>
          <input
            type="checkbox"
            defaultChecked={activeScripts.has(path)}
            onChange={
              e => {
                if (e.currentTarget.checked)
                  activeScripts.add(path)
                else
                  activeScripts.delete(path)
              }}
          />
          {path.replace(/^.*[\\\/]/, '')}
          <button
            onClick={() => {
              setFileOrder(prev => {
                var prev = structuredClone(prev)
                var above = prev[i - 1]
                prev[i - 1] = prev[i]
                prev[i] = above
                return [...prev]
              })
            }}
            disabled={i == 0}
          >
            🔼
          </button>
          <button
            onClick={() => {
              setFileOrder(prev => {
                var prev = structuredClone(prev)
                var below = prev[i + 1]
                prev[i + 1] = prev[i]
                prev[i] = below
                return [...prev]
              })
            }}
            disabled={i >= fileOrder.length - 1}
          >
            🔽
          </button>
          <button>X</button>
        </li>
      )
    }

    setDisplayItems(list)

  }, [fileOrder])

  return <><ul>{displayItems}</ul></>
}

// runs function which passes an object as variable STATIC to be called over multiple lines!
// a single preprocessor file can be linked to multiple open scripts
// list of open preprocessor files that can be assigned to this file with -None- / default option
