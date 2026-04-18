import { RefObject, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import { FixedBar, SplitBottom, SplitLayout, SplitMain, SplitTop } from "./SplitViewLayout";
import ConsoleOutput from "./Console";



export default function PreprocessorManager(
  { activeFile }: {
    activeFile: OpenFile
  }): React.JSX.Element {


  const filemanagerRef = useRef({})
  const consoleRef = useRef<HTMLDivElement>(null)

  const [loadedScripts, setLoadedScripts] = useState<Map<FileID, string>>(new Map())
  const [currentFile, setCurrentFile] = useState<string>('')

  const openProcessorScript = () => {
    window.electron.ipcRenderer.send('preprocessor_open')
  }


  useEffect(() => {
    window.electron.ipcRenderer.on("preprocessor_load", (_, data) => {
      setLoadedScripts(
        // structed clone is needed to retrigger rerendering in use effect, etc.
        prev => structuredClone(prev)
          .set(data.filepath, data.text))
    })
  }, [])


  return <SplitLayout splitRatio={0.45}>
    <FixedBar>
      <button onClick={openProcessorScript}>Open</button>
      <button >Dry Run</button>
      <button
        onClick={() => console.log(filemanagerRef.current.get_active_file_order())}
      >
        Show Active</button>
    </FixedBar>

    <SplitTop>
      {/*TODO: add a combined button that lets you see all the active processors applied in order */}
      <ScriptManager
        scripts={loadedScripts}
        ref={filemanagerRef}
        onDelete={path => {
          setLoadedScripts(prev => {
            prev.delete(path);
            return structuredClone(prev)
          })
        }}
        applyActive={path => setCurrentFile(path)}
      />
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
        value={loadedScripts.get(currentFile) || ""}
      />
      <p>{currentFile} {loadedScripts.get(currentFile)}</p>
    </SplitMain>


  </SplitLayout >
}





// managers the file tabs, file order, user input for deleting files and marking which files are active
function ScriptManager({ scripts, onDelete, applyActive, ref }: {
  scripts: Map<FileID, string>
  onDelete: (path: string) => void
  applyActive: (path: string) => void
  ref: RefObject<any>
}): React.JSX.Element {

  const [fileOrder, setFileOrder] = useState<Array<string>>([])
  const [displayItems, setDisplayItems] = useState<Array<any>>([])
  const [activeScripts, setActiveScripts] = useState<Set<string>>(new Set())


  useEffect(() => { // new Additions
    var additions: Array<string> = []

    // for all filepaths in the master map
    for (const file of scripts.keys())
      if (!fileOrder.includes(file))
        additions.push(file)

    setFileOrder(prev => [...prev, ...additions])
  }, [scripts])

  const DeleteFile = (path: string) => {
    setFileOrder(prev => prev.filter(f => f != path))
    onDelete(path) // call parent function
  }

  useEffect(() => {
    ref.current.get_active_file_order = () => {
      var active: Array<string> = []
      for (const file of fileOrder)
        if (activeScripts.has(file))
          active.push(file)

      return active
    }
  }, [fileOrder])


  useEffect(() => { // re-render the file items
    var list: Array<any> = []

    for (const [i, path] of fileOrder.entries()) {
      list.push(
        <li
          key={path}
          onClick={() => applyActive(path)}
        >
          <input
            type="checkbox"
            defaultChecked={activeScripts.has(path)}
            onChange={
              e => {
                if (e.currentTarget.checked)
                  setActiveScripts(prev => structuredClone(prev.add(path)))
                else
                  setActiveScripts(prev => {
                    prev.delete(path); return structuredClone(prev)
                  })
              }}
          />
          {/* filename only: */}
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
          <button
            onClick={() => DeleteFile(path)}
          >
            X
          </button>
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
