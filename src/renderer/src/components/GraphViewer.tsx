
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
    if (pos.scroll_x == 0 && pos.scroll_y == 0) return // Hacky bugfix

    const container = divRef.current

    requestAnimationFrame(() => {
      container.scrollTop = pos.scroll_y * container.scrollHeight
      container.scrollLeft = pos.scroll_x * (container.scrollWidth - container.clientWidth)
      console.log("goto")
    })
    console.log("restoring Current", type, pos)

  }



  const [zoom, setZoom] = useState<number>(1)
  const [restore, setRestore] = useState<GraphPos | null>(null)
  // const [restoreZoom, setRestoreZoom] = useState<number | null>(null)

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

    setZoom(data.zoom)
    setRestore(data)
  },
    [activeFile, type])

  const getScrollPos = () => {
    const container = divRef.current

    console.log(container.scrollLeft, container.scrollWidth - container.clientWidth)

    var data = structuredClone(blank_graphpos)

    data.scroll_y = container.scrollTop / container.scrollHeight
    data.scroll_x = container.scrollLeft /
      (container.scrollWidth - container.clientWidth)

    data.zoom = zoom

    return data
  }

  const handleScroll = (e) => {
    if (!divRef.current) return

    // TODO: exit if activeScroll isn't loaded

    var pos = getScrollPos()

    // Save position TODO: make it more efficent, stop running these checks every cycle
    if (type == "script")
      activeFile.scroll_pos.script = pos
    else if (type == "summary")
      activeFile.scroll_pos.summary = pos
    else if (type == "sorted")
      activeFile.scroll_pos.sorted = pos
    else
      console.error("invalid GraphViewer type")
  }


  useEffect(() => { // load image and zoom when changed
    if (!divRef.current) return

    const container = divRef.current

    var size: number
    var pos: GraphPos

    if (restore) {
      size = restore.zoom * 100
      pos = restore
      setRestore(null)
    }
    else {
      size = zoom * 100
      pos = getScrollPos()
    }

    container.innerHTML = activeImage.svg
      .replace('width="100%"',
        'height="' + size + '%"') // zoom in out
      .replace(/style=\"max-width:[ 0-9.]+px;\"/i, // remove max width
        'style="margin-left: 50%; margin-right: 50%; display: block"') // center image

    apply_scroll(pos) // ignores (0,0) positions like when initalizing
  }, [
    activeFile,
    activeImage,
    zoom,
    restore
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
      activeFile.scroll_pos.script.zoom = new_zoom
    else if (type == "summary")
      activeFile.scroll_pos.summary.zoom = new_zoom
    else if (type == "sorted")
      activeFile.scroll_pos.sorted.zoom = new_zoom
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


  const [eraseable, setEraseable] = useState<boolean>(false)

  useEffect(() => {
    const erase_on = (event) => {
      if (event.ctrlKey) setEraseable(true)
    }
    const erase_off = (event) => {
      if (!event.ctrlKey) setEraseable(false)
    }

    window.addEventListener('keydown', erase_on);
    window.addEventListener('keyup', erase_off);

    return () => {
      removeEventListener('keydown', erase_on)
      removeEventListener('keyup', erase_off)
    }
  }, [])

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

        {
          /* NOTE: CHANGE THIS to like an array of letters or sth to bind keyboard keys */

          Array.from({ length: 10 }, (_, i) => i).map(key =>
            < Bookmark
              hotkey={((key + 1) % 10).toString()}
              cache_prefix={type}
              activeFile={activeFile}
              get_scroll={getScrollPos}
              set_scroll={apply_scroll}
              erase_mode={eraseable}
              //after_erase={() => setEraseable(false)}
              after_erase={() => { }}
            />
          )
        }
        <button
          onClick={() => { setEraseable(prev => !prev) }}>
          Clear
        </button>

      </div>
    </div>
  </>)
}

// todo add ctrl + mousewheel zoom and zoom buttons
// todo remember scroll position when switching tabs
// background mapping and center
//

function Bookmark({
  hotkey,
  cache_prefix, // used to store and retrieve positions on ActiveFile.bookmarks
  activeFile,
  get_scroll,
  set_scroll,
  erase_mode,
  after_erase,
}: {
  hotkey: string,
  cache_prefix: string,
  activeFile: OpenFile,
  get_scroll: () => GraphPos,
  set_scroll: (p: GraphPos) => void,
  erase_mode: boolean,
  after_erase: () => void
}): React.JSX.Element {

  const cache_id = cache_prefix + hotkey
  const [storedPos, setStoredPos] = useState<GraphPos | null>(null)
  const [state, setState] = useState<BookmarkState>('empty')


  useEffect(() => {
    const retrieve = activeFile.bookmarks.get(cache_id)
    setStoredPos(retrieve ? retrieve : null)
    setState(retrieve ? 'filled' : 'empty')

  }, [activeFile])

  useEffect(() => { // handle css states
    if (storedPos == null)
      if (erase_mode)
        setState('disabled')
      else
        setState('empty')
    else
      if (erase_mode)
        setState("eraseable")
      else
        setState('filled')
  }, [storedPos, erase_mode])



  const trigger = () => { // someone pressed button or hotkey
    // TODO: if clearable
    if (erase_mode) {
      setStoredPos(null)
      activeFile.bookmarks.delete(cache_id)
      after_erase()
    }
    else if (storedPos == null) {
      var current_pos = get_scroll()
      setStoredPos(current_pos)
      activeFile.bookmarks.set(cache_id, current_pos)
    }
    else  // Jump to stored position
      set_scroll(storedPos)
  }


  useEffect(() => { // use keyboard shortcuts here
    const keylistener = (event) => {
      if (event.key == hotkey) trigger()
    }
    window.addEventListener('keydown', keylistener);

    return () => removeEventListener('keydown', keylistener) // cleanup function
  }, [storedPos, erase_mode])


  // TODO: use State to set css styling for button
  return <button
    onClick={trigger}
  >
    {hotkey}_
    {cache_id}_
    {storedPos?.scroll_x}:
    {storedPos?.scroll_y}_
    {state}
  </button>
}
