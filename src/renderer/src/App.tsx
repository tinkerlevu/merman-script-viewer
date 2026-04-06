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


  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const getOpenFile = (filepath: string) =>
    openFiles.find((file) => file.filepath == filepath)

  // NOTE: ---------- file handling

  const [fileTabs, setFileTabs] = useState<FileTabProperties[]>([]);
  // {id: "abc", favicon: test_fav, title: "test_Doc_name", active: true }, // active selects which tab to show
  //
  const blank_img: RenderedImage = {
    svg: "",
    hash: "",
    render_status: "none",
  }

  const blank_markdown: RenderedMD = {
    text: "",
    hash: "",
    render_status: "none",
  }

  const [activeFile, setActiveFile] = useState<OpenFile>({
    filepath: "",
    text: "",
    text_hash: "",
    script: blank_img,
    summary: blank_img,
    sorted: blank_img,
    todo: blank_markdown,
    remember: blank_markdown

  })

  useEffect(() => { // Cleanup Pattern, for IPC race conditions
    // set active file to first item with matching filename
    // clean up duplicates:
    const clean: Array<OpenFile> = []
    var prev: string = ""
    var duplicates: boolean = false

    openFiles.forEach((file) => {
      if (file.filepath != prev) {
        clean.push(file)
        prev = file.filepath
      } else
        duplicates = true
    })

    console.log("clean", clean)

    if (duplicates) {
      setActiveFile( // set Active file to the instance in the clean array that has the corresponding filename
        clean.find((i) => i.filepath == activeFile.filepath))

      setOpenFiles(clean)
    }

  }, [openFiles])

  // TODO: REMOVE
  useEffect(() => console.log("ACTIVE FILE:", activeFile), [activeFile])


  useEffect(() => {
    window.electron.ipcRenderer.on('file_change', (_, data) => {

      if (-1 >= openFiles.findIndex( // existing file not found
        (item) => item.filepath == data.filepath)) {

        const newFile = {
          filepath: data.filepath,
          text: data.text,
          text_hash: "",
          script: blank_img,
          summary: blank_img,
          sorted: blank_img,
          todo: blank_markdown,
          remember: blank_markdown
          // TODO: assigned preprocessor
        }

        setOpenFiles(prev => [...prev, newFile]);
        setActiveFile(newFile)

        setFileTabs([...fileTabs, {
          id: data.filepath,
          favicon: test_fav, // TODO: replace this with proper favicon
          title: data.title,
          active: true
        }])


      } else { // NOTE:: File Already opened
        const changed_file = getOpenFile(data.filepath) // automatically updates active file anyways if it's open


        //@ts-ignore then modify entry in array?
        if (changed_file.text != data.text)

          //@ts-ignore then modify entry in array?
          changed_file.text = data.text
      }

    })
  }, [openFiles, activeFile])


  // TODO: add a file close method
  // WARNING: file close method is needed to stop file modify monitoring

  // NOTE: ---------- end of file handling

  const file_open_action = () => {
    window.electron.ipcRenderer.send('file_open')
  }


  // NOTE: ---------- Displaying Renders
  //

  const [refresher, setRefresher] = useState<number>(0)

  const mermanEditorRef = useRef({ get_text: () => " " });

  const render_merman = () => {
    window.electron.ipcRenderer.send('render', {
      filepath: activeFile.filepath,
      merman: mermanEditorRef.current.get_text()
      // TODO: preprocessor
    })
  }

  useEffect(
    window.electron.ipcRenderer.on("new_render", (_, data) => {
      console.log(data.filepath)
      console.log("image updating", activeFile)

      const update_file = getOpenFile(data.filepath)

      const image_types: Array<RenderImageType>
        = ["script", "summary", "sorted"]


      if (!update_file)
        return console.log("file not found")


      if (image_types.includes(data.type)) {
        const new_image: RenderedImage = {
          svg: data.svg,
          hash: data.hash,
          render_status: "done"
        }

        if (data.type == "script")
          update_file.script = new_image
        if (data.type == "summary")
          update_file.summary = new_image
        if (data.type == "sorted")
          update_file.sorted = new_image

      } else { // markdown types

        const new_markdown: RenderedMD = {
          text: data.text,
          hash: data.hash,
          render_status: "done"
        }

        if (data.type == "todo")
          update_file.todo = new_markdown
        if (data.type == "remember")
          update_file.remember = new_markdown
      }

      setRefresher(refresher + 1) // refresh all image displays

    }),
    [openFiles]
  )


  // TODO: text_hash
  // set hash
  // NOTE: ---------- end of Displaying Renders



  // TODO implement missing actions from Tabs like selecting active, etc.
  // TODO fix add file button css styling
  // TODO fix tab icon css styling
  // TODO add dark mode

  return (
    <>
      <button onClick={() => console.log(openFiles)}>TEST </button>
      <div style={{ height: '95vh' }}>
        <div className='FixedContainer'>
          <FileTabBar
            // darkMode={false}
            draggable
            onTabClose={() => console.log("tab close request")}
            //        onTabReorder={reorder}
            onTabActive={() => console.log(fileTabs)}
            // onDragBegin={() => console.log('Drag started')}
            // onDragEnd={() => console.log('Drag ended')}
            tabs={fileTabs}
            pinnedRight={
              <button
                style={{ height: "100%" }}
                onClick={file_open_action}>
                +
              </button>
            }
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

          <TabPanel forceRender={true}> {/* Write */}
            <MermanEditor
              ActiveFile={activeFile}
              ref={mermanEditorRef}
            />
          </TabPanel>
          <TabPanel > {/* Script */}
            <div>
              <h2 className='FixedContainer'>Test displacement</h2>
            </div>
            <GraphViewer
              activeFile={activeFile}
              type="script"
              refresh={refresher}
            />
          </TabPanel>
          <TabPanel> {/* Summary */}
            <GraphViewer
              activeFile={activeFile}
              type="summary"
              refresh={refresher}
            />
          </TabPanel>
          <TabPanel> {/* Assorted */}
            <GraphViewer
              activeFile={activeFile}
              type="sorted"
              refresh={refresher}
            />
          </TabPanel>
          <TabPanel> {/* Todo.md */}
            <MarkdownViewer text={todo_placeholder} />
          </TabPanel>
          <TabPanel> {/* Remember.md */}
            <MarkdownViewer text={remember_placeholder} />
          </TabPanel>
          <TabPanel forceRender={true}> {/* Preprocessor */}

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
