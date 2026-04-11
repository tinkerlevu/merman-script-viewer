
// TODO PUT ALL CSS ELEMENTS INTO A CENTRAL SPACING FILE WHERE VH is defined for everything !!

import { useEffect, useRef, useState } from "react";
import ContentHeight from "./dynamicSize"

// ------------- working setup :
// <div style={{ position: "relative", height: '100vh'}}>
// const container_style = { position: 'absolute', top: 0, bottom:0, overflow: "scroll", }

export default function GraphViewer(
  { activeFile, type, refresh }: {
    activeFile: OpenFile,
    type: RenderImageType,
    refresh: number

  }
): React.JSX.Element {



  const handleScroll = (e) => console.log(e) //TODO: this next

  const [zoom, setZoom] = useState(100)


  const container_style = {
    overflow: "scroll",
    height: ContentHeight(),
    gridArea: "1/1"
  }

  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return

    var image_data: RenderedImage

    if (type == "script") image_data = activeFile.script
    if (type == "summary") image_data = activeFile.summary
    if (type == "sorted") image_data = activeFile.sorted


    divRef.current.innerHTML = image_data.svg.replace('width="100%"', 'width="' + zoom + '%"').replace(/style=\"max-width:[ 0-9.]+px;\"/i, "")
  }, [
    activeFile,
    activeFile.script,
    activeFile.summary,
    activeFile.sorted,
    zoom,
  ])

  useEffect(() => { }, [refresh]) // force refresh


  useEffect(() => {
    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        // Prevent default browser zoom behavior if desired
        event.preventDefault();

        if (event.deltaY < -1) {
          console.log('Ctrl + Mouse Wheel Up (Zoom In)');
          setZoom(zoom + 10)
        } else {
          console.log('Ctrl + Mouse Wheel Down (Zoom Out)');
          setZoom(Math.max(zoom - 10, 10))
        }
      }
    }, { passive: false }); // 'passive: false' is required to call preventDefault()
  }, [zoom])




  return (<>
    <div style={{ display: 'grid' }}>
      <div
        style={container_style}
        ref={divRef}
        onScroll={handleScroll}
      >
        {/*image displayed here */}
      </div>
      <div style={{
        gridArea: "1/1",
        height: "1%",
        width: "1%",
        // justifySelf: "right"
      }}>
        <button
          onClick={() => setZoom(zoom + 10)}
        >+</button>
        <button
          onClick={() => setZoom(Math.max(zoom - 10, 10))}
        >-</button>
        <button
          onClick={() => setZoom(100)}
        >=</button>
      </div>
    </div>
  </>)
}

// todo add ctrl + mousewheel zoom and zoom buttons
// todo remember scroll position when switching tabs
// background mapping and center
