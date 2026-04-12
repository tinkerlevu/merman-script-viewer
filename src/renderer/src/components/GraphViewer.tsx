
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



  const container_style = {
    overflow: "scroll",
    height: ContentHeight(),
    gridArea: "1/1",
  }

  const divRef = useRef(null);

  const activeImage: RenderedImage | void = // void should never trigger
    type == "script" ? activeFile.script :
      type == "summary" ? activeFile.summary :
        type == "sorted" ? activeFile.sorted :
          console.error("invalid GraphViewer type")

  const blank_graphpos: GraphPos = {
    zoom: 1.0,
    scroll_x: 0,
    scroll_y: 0,
  }

  // have to recall this to actually use the stored scroll position to override the current scroll position
  const restore_scroll = (pos: GraphPos) => {
    if (!divRef.current) return

    const container = divRef.current

    container.scrollTop = pos.scroll_y * container.scrollHeight
    container.scrollLeft = pos.scroll_x * container.scrollWidth

    console.log("restoring Current", type, pos)

  }


  const [activeScroll, setActiveScroll] = useState<GraphPos>(blank_graphpos)

  useEffect(() => {
    var data: GraphPos

    if (type == "script")
      data = activeFile.scroll_pos.script
    else if (type == "summary")
      data = activeFile.scroll_pos.summary
    else if (type == "sorted")
      data = activeFile.scroll_pos.sorted
    else {
      console.error("invalid GraphViewer type")
      data = blank_graphpos
    }

    setActiveScroll(data)
    restore_scroll(data)
  },
    [activeFile, type])


  const saveScrollPos = data => {
    console.log(data)
    // Save position TODO: make it more efficent, stop running these checks every cycle

    if (type == "script")
      activeFile.scroll_pos.script = data
    else if (type == "summary")
      activeFile.scroll_pos.summary = data
    else if (type == "sorted")
      activeFile.scroll_pos.sorted = data
    else
      console.error("invalid GraphViewer type")
  }

  const handleScroll = (e) => {
    if (!divRef.current) return

    const container = divRef.current
    var data = activeScroll

    data.scroll_y = container.scrollTop / container.scrollHeight
    data.scroll_x = container.scrollLeft / container.scrollWidth

    setActiveScroll(data)
    saveScrollPos(data)
  }


  useEffect(() => {
    if (!divRef.current) return

    const container = divRef.current

    container.innerHTML = activeImage.svg
      .replace('width="100%"',
        'width="' + activeScroll.zoom * 100 + '%"') // zoom in out
      .replace(/style=\"max-width:[ 0-9.]+px;\"/i, // remove max width
        'style="margin-left: auto; margin-right: auto; display: block"') // center image

    console.log(activeScroll)

  }, [
    activeFile,
    activeImage,
    activeScroll.zoom
  ])

  useEffect(() => { }, [refresh]) // force refresh

  const setZoom = (ratio: number | null) => {
    // Math.max(

  }


  useEffect(() => {
    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        // Prevent default browser zoom behavior if desired
        event.preventDefault();

        if (event.deltaY < -1)
          setZoom(0.1)
        else
          setZoom(-0.1)

      }
    }, { passive: false }); // 'passive: false' is required to call preventDefault()
  }, [activeScroll.zoom])




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
          onClick={() => setZoom(0.1)}
        >+</button>
        <button
          onClick={() => setZoom(-0.1)}
        >-</button>
        <button
          onClick={() => setZoom(null)} // reset
        >=</button>
      </div>
    </div>
  </>)
}

// todo add ctrl + mousewheel zoom and zoom buttons
// todo remember scroll position when switching tabs
// background mapping and center
