
import { useEffect, useRef, useState } from "react";
import ContentHeight from "./dynamicSize"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlassMinus, faMagnifyingGlassPlus, faExpand, faTrashArrowUp } from '@fortawesome/free-solid-svg-icons'


import '../assets/graphviewer.css'
import { GraphPos, OpenFile, RenderedImage, RenderImageType } from "@renderer/env";

const ScrollPos_Cache = new Map<string | GraphPos>()


export default function GraphViewer(
  { activeFile, type, refresh, outdated }: {
    activeFile: OpenFile,
    type: RenderImageType,
    refresh: number
    outdated: boolean

  }
): React.JSX.Element {


  const container_style = {
    overflow: "scroll",
    height: ContentHeight(),
    gridArea: "1/1",
  }

  const divRef = useRef(null);
  const renderRef = useRef<HTMLDivElement>(null);

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

  const GET_KEY = () => activeFile.filepath + "_" + type

  const [zoom, setZoom] = useState<number>(1)

  // SAVING scroll and zoom state before switching tabs:
  useEffect(() => {
    // subscribe on load or file change
    activeFile.scroll_pos.save_graph_pos = () => {
      ScrollPos_Cache.set(GET_KEY(), getScrollPos())
    }

    // unsub on unload or before different file is loaded
    return () => { activeFile.scroll_pos.save_graph_pos = () => { } }

  }, [activeFile, zoom])

  // have to recall this to actually use the stored scroll position to override the current scroll position
  const apply_scroll = (pos: GraphPos) => {
    if (!divRef.current) return

    const container = divRef.current

    requestAnimationFrame(() => { // wait for rendering to finish
      container.scrollTop = pos.scroll_y * container.scrollHeight
      container.scrollLeft = pos.scroll_x * (container.scrollWidth - container.clientWidth)
      ScrollPos_Cache.set(GET_KEY(), pos) // re-assert position after waiting for rendering to finish
    })
    console.log("restoring Current", activeFile.filepath, type, pos)

  }

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

  useEffect(() => { // load image and restore scrolling and zoom on load or when image changed
    if (!divRef.current) return

    var restore = ScrollPos_Cache.get(GET_KEY())

    if (!restore) {
      restore = structuredClone(blank_graphpos)
      ScrollPos_Cache.set(GET_KEY(), restore)
    }

    renderRef.current.innerHTML = activeImage.svg
      .replace('width="100%"', "height=100%")
      // zoom in out
      .replace(/style=\"max-width:[ 0-9.]+px;\"/i, // remove max width
        'style="margin-left: 500px; margin-right: 500px;"') // TODO: fix centering this is a temp solution


    setZoom(restore.zoom)
    apply_scroll(restore)

  }, [
    activeFile,
    activeImage,
    refresh,
  ])

  useEffect(() => { }, [refresh]) // force refresh

  useEffect(() => {
    if (!renderRef.current) return

    renderRef.current.style.height = zoom * 100 + "%"

    apply_scroll(ScrollPos_Cache.get(GET_KEY()))

  }, [zoom])

  const setZoomRatio = (ratio: number | null) => {
    var new_zoom: number

    if (ratio)
      new_zoom = zoom + zoom * ratio
    else
      new_zoom = 1
    // TODO: apply bounds to zoom

    var current_pos = getScrollPos()
    current_pos.zoom = new_zoom

    ScrollPos_Cache.set(GET_KEY(), current_pos)
    console.log("setting cache")
    setZoom(new_zoom) // trigger refresh


  }


  useEffect(() => {
    const listner = (event) => {
      if (event.ctrlKey) {
        // Prevent default browser zoom behavior if desired
        event.preventDefault();

        if (event.deltaY < -1)
          setZoomRatio(event.shiftKey ? 0.5 : 0.1)
        else
          setZoomRatio(event.shiftKey ? -0.5 : -0.1)
      }
    }

    window.addEventListener('wheel', listner, { passive: false }); // 'passive: false' is required to call preventDefault()
    return () => window.removeEventListener('wheel', listner)
  }, [zoom, activeImage])


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
    <div style={{ display: 'grid' }} className="mermaid">
      <div
        style={container_style}
        ref={divRef}
        //onScroll={handleScroll}
        className={outdated ? 'graph-outdated' : 'graph-up-to-date'}
      >
        <div
          ref={renderRef}
          style={{ marginLeft: "30%", marginRight: "30%" }} // TODO: fix centering, this is a temp solution
        >

          {/*image displayed here */}
        </div>
      </div>
      <div className="graph-controls"
        style={{
          gridArea: "1/1",
          height: "1%",
          width: "1%",
          // justifySelf: "right"
        }}>
        <button
          onClick={() => setZoomRatio(0.1)}
        >
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
        </button>
        <button
          onClick={() => setZoomRatio(-0.1)}
        >
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
        </button>
        <button
          onClick={() => setZoomRatio(null)} // reset
        >
          <FontAwesomeIcon icon={faExpand} />
        </button>

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
          onClick={() => { setEraseable(prev => !prev) }}
          className={eraseable ? 'exit-erase' : 'start-erase'}
        >
          <FontAwesomeIcon icon={faTrashArrowUp} />
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
  const [triggered, setTriggered] = useState<boolean>(false)


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
    else   // activate Jump to stored position
      set_scroll(storedPos)

  }


  useEffect(() => { // use keyboard shortcuts here
    const keylistener = (event) => {
      if (event.key != hotkey) return
      trigger()
      setTriggered(true)
    }
    window.addEventListener('keydown', keylistener);
    window.addEventListener('keyup', () => setTriggered(false));

    return () => removeEventListener('keydown', keylistener) // cleanup function
  }, [storedPos, erase_mode])


  // TODO: use State to set css styling for button
  return <button
    onClick={trigger}
    className={state + " " + (triggered ? 'activated' : '')}
  >
    {hotkey}
    {/* _{cache_id}_ */}
    {/* {storedPos?.scroll_x}: */}
    {/* {storedPos?.scroll_y}_ */}
    {/* {state} */}
  </button>
}
