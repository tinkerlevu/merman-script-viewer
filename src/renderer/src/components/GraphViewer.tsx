
// TODO PUT ALL CSS ELEMENTS INTO A CENTRAL SPACING FILE WHERE VH is defined for everything !!

import { useEffect, useRef } from "react";
import ContentHeight from "./dynamicSize"

// ------------- working setup :
// <div style={{ position: "relative", height: '100vh'}}>
// const container_style = { position: 'absolute', top: 0, bottom:0, overflow: "scroll", }

const image_style = { width: "500px" } // CHANGE THIS TO SOMETHING DYNAMIC


export default function GraphViewer(
  { activeFile, type, refresh }: {
    activeFile: OpenFile,
    type: RenderImageType,
    refresh: number

  }
): React.JSX.Element {


  const container_style = { overflow: "scroll", height: ContentHeight() }
  console.log(container_style)
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return

    var image_data: RenderedImage

    if (type == "script") image_data = activeFile.script
    if (type == "summary") image_data = activeFile.summary
    if (type == "sorted") image_data = activeFile.sorted

    divRef.current.innerHTML = image_data.svg
  }, [
    activeFile,
    activeFile.script,
    activeFile.summary,
    activeFile.sorted
  ])

  useEffect(() => { }, [refresh]) // force refresh

  return (<>
    <div style={container_style} ref={divRef}>
      {/*<img className="Flowchart-Graph" style={image_style} src={src} />*/}
    </div>
  </>)
}

// todo add ctrl + mousewheel zoom and zoom buttons
// todo remember scroll position when switching tabs
// background mapping and center
