
// TODO PUT ALL CSS ELEMENTS INTO A CENTRAL SPACING FILE WHERE VH is defined for everything !!

import ContentHeight from "./dynamicSize"

// ------------- working setup :
// <div style={{ position: "relative", height: '100vh'}}>
// const container_style = { position: 'absolute', top: 0, bottom:0, overflow: "scroll", }

const image_style = { width: "500px" } // CHANGE THIS TO SOMETHING DYNAMIC


export default function GraphViewer(
  { src }:
    { src: string }
): React.JSX.Element {


  const container_style = { overflow: "scroll", height: ContentHeight() }
  console.log(container_style)

  return (<>
    <div style={container_style}>
      <img className="Flowchart-Graph" style={image_style} src={src} />
    </div>
  </>)
}

// todo add ctrl + mousewheel zoom and zoom buttons
// todo remember scroll position when switching tabs
// background mapping and center
