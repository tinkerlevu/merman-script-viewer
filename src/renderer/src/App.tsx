// ------------------------------ TODO REPLACE THESE -------------------------------
import Versions from './components/Versions' // replace with WORD COUNT
import test_fav from "./assets/favicons/test.ico"
import script_palceholder from "./assets/test-remove/script_placeholder.svg"
import summary_placeholder from "./assets/test-remove/summary_placeholder.svg"
import sorted_placeholder from "./assets/test-remove/sorted_placeholder.svg"
import remember_placeholder from "./assets/test-remove/remember_placeholder.md?raw"
import todo_placeholder from "./assets/test-remove/todo_placeholder.md?raw"






import { useEffect, useRef, useState } from 'react';
import { TabProperties as FileTabProperties } from '@sinm/react-chrome-tabs/dist/chrome-tabs';
import { Tabs as FileTabBar } from '@sinm/react-chrome-tabs';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

// my components
import GraphViewer from './components/GraphViewer';



// for file tabs
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
// for regular tabs
import 'react-tabs/style/react-tabs.css';


// my stuff
// import layout from './assets/spacing.module.css';
import windowDimensions from './components/dynamicSize'
import ContentHeight from './components/dynamicSize'
import CodeEditor from './components/CodeEditor'
import MarkdownViewer from './components/MarkdownViewer'
import MermanEditor from './components/MermanEditor'




function App(): React.JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')



  const [fileTabs, setFileTabs] = useState<FileTabProperties[]>([
    { id: "abc", favicon: test_fav, title: "test_Doc_name", active: true }, // active selects which tab to show
    { id: "def", favicon: test_fav, title: "test_Doc_name2", active: false },
  ]);


  const file_open_action = () => {
    window.electron.ipcRenderer.send('file_open')
  }

  const render_merman = () => {
    window.electron.ipcRenderer.send('render')
  }



  // TODO implement missing actions from Tabs like selecting active, etc.
  // TODO fix add file button css styling
  // TODO fix tab icon css styling
  // TODO add dark mode

  return (
    <>
      <div style={{ height: '95vh' }}>
        <div className="FixedContainer">
          <FileTabBar
            // darkMode={false}
            draggable
            onTabClose={() => console.log("tab close request")}
            //        onTabReorder={reorder}
            onTabActive={() => console.log("active tab changed")}
            // onDragBegin={() => console.log('Drag started')}
            // onDragEnd={() => console.log('Drag ended')}
            tabs={fileTabs}
            pinnedRight={<button style={{ height: "100%" }} onClick={file_open_action}>+</button>}
          />
        </div>

        <Tabs>
          <div className='FixedContainer'>
            <TabList>
              <Tab><img src={test_fav} style={{ height: "20px" }} /> Write</Tab>
              <Tab>Script</Tab>
              <Tab>Summary</Tab>
              <Tab>Sorted</Tab>
              <Tab>Todo</Tab>
              <Tab>Remember</Tab>
              <Tab>Preprocessor</Tab>
              <button onClick={render_merman}>Render</button>
              <input type="checkbox" />Darkmode
            </TabList>
          </div>

          <TabPanel > {/* Write */}
            <MermanEditor />
          </TabPanel>
          <TabPanel > {/* Script */}
            <div>
              <h2 className='FixedContainer'>Test displacement</h2>
            </div>
            <GraphViewer src={script_palceholder} />
          </TabPanel>
          <TabPanel> {/* Summary */}
            <GraphViewer src={summary_placeholder} />
          </TabPanel>
          <TabPanel> {/* Assorted */}
            <GraphViewer src={sorted_placeholder} />
          </TabPanel>
          <TabPanel> {/* Todo.md */}
            <MarkdownViewer text={todo_placeholder} />
          </TabPanel>
          <TabPanel> {/* Remember.md */}
            <MarkdownViewer text={remember_placeholder} />
          </TabPanel>
          <TabPanel> {/* Preprocessor */}

            runs function which passes an object as variable STATIC to be called over multiple lines!
            <button>New</button>
            <button>Open</button>
            a single preprocessor file can be linked to multiple open scripts
            <button>Save</button>
            <button >Save As</button>
            <input type="checkbox" /> Skip (disable for this file)
            list of open preprocessor files that can be assigned to this file with -None- / default option
            error, and console log outputs
            <CodeEditor type="javascript" />
          </TabPanel>
        </Tabs>

        Height : <span>{ContentHeight()}</span>

      </div>
    </>
  )
}

export default App
