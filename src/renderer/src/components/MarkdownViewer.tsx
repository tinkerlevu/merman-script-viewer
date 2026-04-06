import MarkdownPreview from '@uiw/react-markdown-preview';
import { useEffect, useState } from 'react';


export default function MarkdownViewer(
  { activeFile, type, refresh }: {
    activeFile: OpenFile,
    type: RenderMDType,
    refresh: number
  }
): React.JSX.Element {

  useEffect(() => { }, [refresh]) // force refresh

  const [text, setText] = useState('')

  useEffect(() => {
    if (type == "todo")
      setText(activeFile.todo.text)
    if (type == "remember")
      setText(activeFile.remember.text)
  }, [activeFile, activeFile.todo, activeFile.remember])


  return (<>
    <MarkdownPreview source={text} style={{ padding: 16 }} />
  </>)
}
