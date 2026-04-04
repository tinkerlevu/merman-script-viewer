// import './assets/main.css'
// import './assets/base.css'

import mermaid from 'mermaid'
import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'




// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  // TODO: add more configurations here!
  maxTextSize: Number.MAX_SAFE_INTEGER,
  maxEdges: Number.MAX_SAFE_INTEGER,
});


const MermaidChart = (
  { chart, type, isDone, afterDone }: {
    chart: string | null,
    type: string,
    isDone: () => void,
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

        isDone(); // set corresponding done flag to true
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


  var scriptDone = false;
  var summaryDone = false;
  var sortDone = false;

  // sets script Done, summary done, etc. to true and checks if everything is done or not
  const checkDone = () => {
    console.log("CHECKING if DONE", scriptDone, summaryDone, sortDone)
    if (scriptDone && summaryDone && sortDone) {
      // TODO: send ipc message to close window here
      console.log("ALL DONE")
    }

    // NOTE: this can be used to pass params to mermaid:
    // console.log(JSON.parse(
    //   process.argv.find(
    //     arg => arg.startsWith('--maxMermaidChars')
    //   ).split('=')[1])
    // )
  }
  return (<>
    <MermaidChart
      chart={scriptDef}
      type="script"
      isDone={() => scriptDone = true}
      afterDone={checkDone}
    />
    <MermaidChart
      chart={summaryDef}
      type="summary"
      isDone={() => summaryDone = true}
      afterDone={checkDone}
    />
    <MermaidChart
      chart={sortDef}
      type="sorted"
      isDone={() => sortDone = true}
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

