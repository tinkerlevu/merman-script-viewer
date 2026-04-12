import MarkdownPreview from '@uiw/react-markdown-preview';
import { useEffect, useRef, useState } from 'react';
import ContentHeight from './dynamicSize';


export default function MarkdownViewer(
  { activeFile, type, refresh }: {
    activeFile: OpenFile,
    type: RenderMDType,
    refresh: number
  }
): React.JSX.Element {

  useEffect(() => { }, [refresh]) // force refresh

  const container_style = {
    overflowX: "hidden",
    overflowY: "scroll",
    height: ContentHeight(),
    width: '100%',
  }


  const [text, setText] = useState('')
  const divRef = useRef(null)

  useEffect(() => {
    if (type == "todo")
      setText(activeFile.todo.text)
    if (type == "remember")
      setText(activeFile.remember.text)
  }, [activeFile, activeFile.todo, activeFile.remember])

  useEffect(() => {
    if (text == '') return // text not loaded yet
    if (!divRef.current) return
    divRef.current.scrollTop =
      type == "todo" ? activeFile.scroll_pos.todo.scroll :
        activeFile.scroll_pos.remember.scroll
    console.log("setting scroll", type)

  }, [text, divRef.current, activeFile, type])

  const handleScroll = (_) => {
    if (!divRef.current) return
    if (type == "todo")
      activeFile.scroll_pos.todo.scroll = divRef.current?.scrollTop
    else if (type == "remember")
      activeFile.scroll_pos.remember.scroll = divRef.current?.scrollTop
    else
      console.error("Wrong MD viewer type")
  }


  return (<>
    <div
      style={container_style}
      ref={divRef}
      onScroll={handleScroll}
    >
      <MarkdownPreview
        source={text}
        style={{ padding: 16 }}
      />
    </div>
  </>)
}
