import { act, useEffect, useState } from "react"


const console_buffer = new Map<FileID, Set<string>>()

const convert_to_buffer = (
  buffer_set: Set<string> | undefined): string => {
  if (!buffer_set) return ""

  var full_string = ""
  for (const line of buffer_set)
    full_string += JSON.parse(line).text

  return full_string
}

export default function ConsoleOutput(
  { activeFile }: {
    activeFile: OpenFile
  }): React.JSX.Element {


  const [currentBuffer, setCurrentBuffer] = useState<string>("")

  const refreshBuffer = () =>
    setCurrentBuffer(
      convert_to_buffer(activeFile.console_buffer)
    )

  useEffect(() => {
    window.electron.ipcRenderer.on("console_log", (_, data) => {
      // save line object in ref to activefile
      // get open file activeFile.console_buffer.add(JSON.stringify(data))

      refreshBuffer()

    })
  }, [activeFile])

  useEffect(() => {
    refreshBuffer()
    // TODO: scroll to bottom

  }, [activeFile])


  // TODO: add ipc on for 'console_log', 'console_error'? and 'clear_console'

  //TODO: add overflow scroll here
  // and saving scroll position
  return <>
    <div style={{ whiteSpace: 'pre-line' }}>
      {currentBuffer}
    </div >
  </>
}
