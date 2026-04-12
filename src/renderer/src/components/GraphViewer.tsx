
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
  const apply_scroll = (pos: GraphPos) => {
    if (!divRef.current) return

    const container = divRef.current

    requestAnimationFrame(() => {
      container.scrollTop = pos.scroll_y * container.scrollHeight
      container.scrollLeft = pos.scroll_x * container.scrollWidth
    })
    console.log("restoring Current", type, pos)

  }



  const [zoom, setZoom] = useState<number>(1)
  const [restoreScroll, setRestoreScroll] = useState<GraphPos | null>(null)
  const [restoreZoom, setRestoreZoom] = useState<number | null>(null)

  useEffect(() => {
    var data: GraphPos
    var stored_zoom: number

    if (type == "script") {
      data = activeFile.scroll_pos.script
      stored_zoom = activeFile.zoom.script
    }
    else if (type == "summary") {
      data = activeFile.scroll_pos.summary
      stored_zoom = activeFile.zoom.summary
    }
    else if (type == "sorted") {
      data = activeFile.scroll_pos.sorted
      stored_zoom = activeFile.zoom.sorted
    }
    else {
      console.error("invalid GraphViewer type")
      data = blank_graphpos
      stored_zoom = 1
    }

    setRestoreZoom(stored_zoom)
    setZoom(stored_zoom)
    setRestoreScroll(data)
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

    // TODO: exit if activeScroll isn't loaded

    const container = divRef.current
    var data = blank_graphpos

    data.scroll_y = container.scrollTop / container.scrollHeight
    data.scroll_x = container.scrollLeft / container.scrollWidth

    saveScrollPos(data)
  }


  useEffect(() => {
    if (!divRef.current) return

    const container = divRef.current

    var size: number

    if (restoreScroll && restoreZoom)
      size = restoreZoom * 100
    else
      size = zoom * 100

    container.innerHTML = activeImage.svg
      .replace('width="100%"',
        'width="' + size + '%"') // zoom in out
      .replace(/style=\"max-width:[ 0-9.]+px;\"/i, // remove max width
        'style="margin-left: auto; margin-right: auto; display: block"') // center image

    if (restoreScroll && restoreZoom) {
      console.log("restoring")
      apply_scroll(restoreScroll)
      setRestoreScroll(null)
      setRestoreZoom(null)
    }
    else
      console.log("normal", zoom)



  }, [
    activeFile,
    activeImage,
    zoom,
    restoreScroll,
    restoreZoom
  ])

  useEffect(() => { }, [refresh]) // force refresh

  const setZoomRatio = (ratio: number | null) => {
    var new_zoom: number

    if (ratio)
      new_zoom = zoom + zoom * ratio
    else
      new_zoom = 1
    // TODO: Math.max(

    if (type == "script")
      activeFile.zoom.script = new_zoom
    else if (type == "summary")
      activeFile.zoom.summary = new_zoom
    else if (type == "sorted")
      activeFile.zoom.sorted = new_zoom
    else
      console.error("invalid GraphViewer type")

    setZoom(new_zoom)

  }


  useEffect(() => {
    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        // Prevent default browser zoom behavior if desired
        event.preventDefault();

        if (event.deltaY < -1)
          setZoomRatio(0.1)
        else
          setZoomRatio(-0.1)

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
          onClick={() => setZoomRatio(0.1)}
        >+</button>
        <button
          onClick={() => setZoomRatio(-0.1)}
        >-</button>
        <button
          onClick={() => setZoomRatio(null)} // reset
        >=</button>
      </div>
    </div>
  </>)
}

// todo add ctrl + mousewheel zoom and zoom buttons
// todo remember scroll position when switching tabs
// background mapping and center
