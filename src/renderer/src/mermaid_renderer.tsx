// import './assets/main.css'
// import './assets/base.css'

import mermaid from 'mermaid'
import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'




function Renderer(): React.JSX.Element {
  const init = useEffect(() => {
    console.log('hello init')
    window.electron.ipcRenderer.send('renderer_initalized', 'payload')
  })

  return (
    <>
      <div></div>
    </>
  )
}

const test_def = 'graph TB\na-->b'

const MermaidChart = ({ chart }) => { // TODO: add type variable for ipccallback
  const divRef = useRef(null);

  useEffect(() => {
    if (divRef.current) {
      // Generate unique ID for rendering
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      // Render the diagram
      mermaid.render(id, chart).then(({ svg }) => {
        if (divRef.current) {
          divRef.current.innerHTML = svg;
        }
        // WARNING: change the channel on this send:
        window.electron.ipcRenderer.send('renderer_initalized', svg)
      });
    }
  }, [chart]);

  return <div ref={divRef} className="mermaid"></div>;
};





createRoot(document.getElementById('root')!).render(
  <StrictMode>
    hello worold lsdkfjsdlfkjsdj
    <Renderer />
    <MermaidChart chart={test_def} />
  </StrictMode>
)

