import { useEffect, useState } from "react"


// NOTE: OpenFile.console_buffer stores ConsoleBufferLine objects in a set as Json Strings
const convert_to_buffer = (
  buffer_set: Set<string> | undefined): string => {
  if (!buffer_set) return ""

  var full_string = ""
  for (const line of buffer_set)
    full_string += JSON.parse(line).text

  return full_string
}



export default function ConsoleOutput(
  { activeFile, scrollToBottom, takeFocus, style }: {
    activeFile: OpenFile,
    scrollToBottom: () => void,
    takeFocus: () => void,
    style: any
  }): React.JSX.Element {


  const [currentBuffer, setCurrentBuffer] = useState<string>("")

  const refreshBuffer = () =>
    setCurrentBuffer(
      convert_to_buffer(activeFile.console_buffer)
    )

  useEffect(() => {
    // NOTE: Main IPC handling and data entering is handled in App.tsx
    window.electron.ipcRenderer.on("console_log", (_, data) => {
      refreshBuffer()
    })
  }, [activeFile])


  useEffect(() => { // when switching tabs
    refreshBuffer() // change to current files console output
  }, [activeFile])

  useEffect(() => {
    scrollToBottom()
    takeFocus()
  }, [currentBuffer])



  // TODO: add ipc on for 'console_log', 'console_error'? and 'clear_console'

  //TODO: add overflow scroll here
  return <>
    <div style={{ ...style, whiteSpace: 'pre-line' }}>
      {currentBuffer}
    </div >
  </>
}
