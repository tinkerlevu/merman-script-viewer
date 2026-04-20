import { RefObject, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import { FixedBar, SplitBottom, SplitLayout, SplitMain, SplitTop } from "./SplitViewLayout";
import ConsoleOutput from "./Console";



export default function PreprocessorManager(
  { activeFile, ref = useRef({}) }: {
    activeFile: OpenFile
    ref: RefObject<any>
  }): React.JSX.Element {


  const filemanagerRef = useRef({})
  const consoleRef = useRef<HTMLDivElement>(null)

  const [loadedScripts, setLoadedScripts] = useState<Map<FileID, string>>(new Map())
  const [currentFile, setCurrentFile] = useState<FileID>('')
  const [showText, setShowText] = useState<string>('')

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



  useEffect(() => {
    const active_file_contents = () => {
      var compiled: string = ''
      for (const file of filemanagerRef
        .current.get_active_file_order())
        compiled += (loadedScripts.get(file))

      return compiled
    }

    if (currentFile != '')
      setShowText(loadedScripts.get(currentFile) || "")
    else
      setShowText(active_file_contents())

    // NOTE: this is how to get the code for rendering
    ref.current.get_active_file_contents = active_file_contents

  }, [currentFile, loadedScripts])


  return <SplitLayout splitRatio={0.45}>
    <FixedBar>
      <button onClick={openProcessorScript}>Open</button>
      <button >Dry Run</button>
      <button
        onClick={() => setCurrentFile('')}
      >
        Show Result</button>
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
      <h1>Preview</h1>
      <CodeEditor type="javascript"
        value={showText}
      />
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

    // scripts is master map of filename_id -> contents
    for (const file of scripts.keys())
      if (!fileOrder.includes(file)) { // new file added
        additions.push(file)
        setActiveScripts( // mark new file as automatically active
          prev => structuredClone(prev.add(file)))
        applyActive(file)
      }

    setFileOrder(prev => [...prev, ...additions])
  }, [scripts])

  const DeleteFile = (path: string) => {
    setFileOrder(prev => prev.filter(f => f != path))
    onDelete(path) // call parent element function
  }

  useEffect(() => {
    ref.current.get_active_file_order = () => {
      var active: Array<string> = []
      for (const file of fileOrder)
        if (activeScripts.has(file))
          active.push(file)

      return active
    }
  }, [fileOrder, activeScripts])


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
                setFileOrder(structuredClone(fileOrder))
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
