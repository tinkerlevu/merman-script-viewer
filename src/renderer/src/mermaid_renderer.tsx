// import './assets/main.css'
// import './assets/base.css'

import mermaid from 'mermaid'
import { ReactSVGElement, StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'




// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});


const MermaidChart = (
  { chart, type, isDone, afterDone }: {
    chart: string | null,
    type: string,
    isDone: (newValue: boolean) => void,
    afterDone: () => void
  }
) => { // TODO: add type variable for ipccallback
  const divRef = useRef(null);

  useEffect(() => {
    if (divRef.current) {
      // Generate unique ID for rendering
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      if (!chart) return; // if chart is null

      // Render the diagram
      mermaid.render(id, chart).then(({ svg }) => {
        if (divRef.current) {
          divRef.current.innerHTML = svg;
        }
        window.electron.ipcRenderer.send(
          'render_done',
          {
            type: type,
            svg: svg
          })

        isDone(true); // set corresponding done flag to true
        afterDone()
      });
    }
  }, [chart]);

  return <div ref={divRef} className="mermaid"></div>;
};



// ---------- END OF MERMAID STUFF
//
// get and render data


// TODO: REMOVE
const test_def = 'graph TB\na-->b'



function Renderer(): React.JSX.Element {
  var [scriptDef, setScriptDef] = useState(null);
  var [summaryDef, setSummaryDef] = useState(null);
  var [sortDef, setSortDef] = useState(null);


  window.electron.ipcRenderer.on('start_render', (event, data) => {
    setScriptDef(data.script.join(''))
    setSummaryDef(data.summary.join(''))
    setSortDef(data.sorted.join(''))
  })


  var [scriptDone, setScriptDone] = useState(false);
  var [summaryDone, setSummaryDone] = useState(false);
  var [sortDone, setSortDone] = useState(false);

  // sets script Done, summary done, etc. to true and checks if everything is done or not
  const checkDone = () => {
    console.log("CHECKING if DONE")
    if (scriptDone && summaryDone && sortDone) {
      // TODO: send ipc message to close window here
      console.log("ALL DONE")
    }
  }
  return (<>
    <MermaidChart
      chart={scriptDef}
      type="script"
      isDone={setScriptDone}
      afterDone={checkDone}
    />
    <MermaidChart
      chart={summaryDef}
      type="summary"
      isDone={setSummaryDone}
      afterDone={checkDone}
    />
    <MermaidChart
      chart={sortDef}
      type="sorted"
      isDone={setSortDone}
      afterDone={checkDone}
    />
  </>)
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    hello worold lsdkfjsdlfkjsdj
    <Renderer />

  </StrictMode>
)

