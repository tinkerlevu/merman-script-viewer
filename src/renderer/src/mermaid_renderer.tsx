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
  { chart, type, isDone, afterDone, hash, filepath }: {
    chart: string | null,
    type: string,
    isDone: () => void,
    afterDone: () => void,
    hash: string,
    filepath: string
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
            svg: svg,
            filepath: filepath,
            hash: hash
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



function Renderer(): React.JSX.Element {
  // NOTE: hash is used to match a generated graph image to specific input merman text, filepath is a universal id used to coordinate mutiple parts of the program
  var [scriptDef, setScriptDef] = useState(null);
  var [summaryDef, setSummaryDef] = useState(null);
  var [sortDef, setSortDef] = useState(null);
  var [hash, setHash] = useState("");
  var [filepath, setFilepath] = useState('');


  window.electron.ipcRenderer.on('start_render', (event, data) => {
    setFilepath(data.filepath)
    setHash(data.hash)
    setScriptDef(data.mermaid.script.join(''))
    setSummaryDef(data.mermaid.summary.join(''))
    setSortDef(data.mermaid.sorted.join(''))
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
      hash={hash}
      filepath={filepath}
    />
    <MermaidChart
      chart={summaryDef}
      type="summary"
      isDone={() => summaryDone = true}
      afterDone={checkDone}
      hash={hash}
      filepath={filepath}
    />
    <MermaidChart
      chart={sortDef}
      type="sorted"
      isDone={() => sortDone = true}
      afterDone={checkDone}
      hash={hash}
      filepath={filepath}
    />
  </>)
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    hello worold lsdkfjsdlfkjsdj
    <Renderer />

  </StrictMode>
)

