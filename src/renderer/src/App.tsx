// ------------------------------ TODO: REPLACE THESE -------------------------------
import Versions from './components/Versions' // TODO: replace with WORD COUNT, and put word count on processed tab

import light_mode_icon from "./assets/favicons/lightmode.png"
import dark_mode_icon from "./assets/favicons/darkmode.png"

import done_fav from "./assets/favicons/filetab_done.ico"
import fail_fav from "./assets/favicons/filetab_failed.ico"
import wait_fav from "./assets/favicons/filetab_loading.ico"
import process_fav from "./assets/favicons/test.ico" // FIX: change this
import none_fav from "./assets/favicons/filetab_none.ico"


import { useEffect, useRef, useState } from 'react';
import { TabProperties as FileTabProperties } from '@sinm/react-chrome-tabs/dist/chrome-tabs';
import { Tabs as FileTabBar } from '@sinm/react-chrome-tabs';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faPlus, } from '@fortawesome/free-solid-svg-icons'

// for file tabs
import '@sinm/react-chrome-tabs/css/chrome-tabs.css';
import '@sinm/react-chrome-tabs/css/chrome-tabs-dark-theme.css';
// for regular tabs
//import 'react-tabs/style/react-tabs.css';
//

// For highlighting
import { useEditorTheme } from "prism-react-editor/themes"


// my components and stuff
// import layout from './assets/spacing.module.css';
import MarkdownViewer from './components/MarkdownViewer'
import MermanEditor from './components/MermanEditor'
import TabIcon from './components/TabIcon'
import CodeIcon from './components/CodeIcon'
import PreprocessorManager from './components/PreprocessorManager'
import { DocPos, GraphPos, OpenFile, RenderedImage, RenderedMD, Hash, RenderMDType, RenderImageType } from './env'
import PreprocessorViewer from './components/PreprocessorViewer'
import GraphViewer from './components/GraphViewer';

// my styles
import './assets/base.css'
import './assets/react-tabs.css'
import './assets/buttons.css'


function App(): React.JSX.Element {

  // NOTE: --------- Meta file stuff
  const blank_img = (): RenderedImage => {
    return {
      svg: "",
      hash: "",
      render_status: "none",
    }
  }

  const blank_markdown = (): RenderedMD => {
    return {
      text: "",
      hash: "",
      render_status: "none",
    }
  }

  const blank_graphpos = (): GraphPos => {
    return {
      zoom: 1.0,
      scroll_x: 0.5, // middle of page
      scroll_y: 0,
    }
  }


  const blank_docpos = (): DocPos => {
    return {
      scroll: 0
    }
  }


  const blank_file: OpenFile = {
    filepath: "",
    text: "",
    unsaved_text: "",
    text_hash: "",
    render_status: "none",
    script: blank_img(),
    summary: blank_img(),
    sorted: blank_img(),
    todo: blank_markdown(),
    remember: blank_markdown(),
    auto_render: false,
    scroll_pos: {
      script: blank_graphpos(),
      summary: blank_graphpos(),
      sorted: blank_graphpos(),
      todo: blank_docpos(),
      remember: blank_docpos(),
      merman: blank_docpos(),
    },
    bookmarks: new Map(),
    console_buffer: new Set(),
    preprocessed: {
      lines: [],
      hash: "",
      render_status: "none"
    }
  }

  // NOTE: ---------- Merman File variables

  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<OpenFile>(blank_file)


  const getOpenFile = (filepath: string) =>
    openFiles.find((file) => file.filepath == filepath)


  const [fileTabs, setFileTabs] = useState<FileTabProperties[]>([]);
  // {id: "abc", favicon: test_fav, title: "test_Doc_name", active: true }, // active selects which tab to show


  // NOTE: ---------- Handling Merman Files and file tabs

  useEffect(() => { // Cleanup Pattern, for IPC race conditions
    // set active file to first item with matching filename
    // clean up duplicates:
    var clean: Array<OpenFile> = []
    var unique: Array<string> = []

    openFiles.forEach((file) => {
      if (!unique.includes(file.filepath)) {
        clean.push(file)
        unique.push(file.filepath)
      }
    })


    var clean_tab: Array<FileTabProperties> = []
    unique = []

    fileTabs.forEach((file) => {
      if (!unique.includes(file.id)) {
        clean_tab.push(file)
        unique.push(file.id)
      }
    })

    if (clean_tab.length != fileTabs.length)
      setFileTabs(clean_tab.map( // apply remove duplicates but keep focus on currently selected tab
        tab => ({ ...tab, active: activeFile.filepath == tab.id })))

    if (clean.length != openFiles.length) { // there were duplicates
      setActiveFile( // set Active file to the instance in the clean array that has the corresponding filename
        clean.find((i) => i.filepath == activeFile.filepath))

      setOpenFiles(clean)

    }

  }, [openFiles, fileTabs])


  useEffect(() => {
    window.electron.ipcRenderer.on('file_change', (_, data) => {


      if (data.newfile) {

        console.log("newFile")

        const newFile = structuredClone(blank_file)
        newFile.filepath = data.filepath
        newFile.text = data.text
        newFile.unsaved_text = data.text // for bug in formal build?

        setOpenFiles(prev => [...prev, newFile]);
        setActiveFile(newFile)

        console.log("adding new tab")

        setFileTabs(tabs => [...tabs, {
          id: data.filepath,
          favicon: none_fav,
          title: data.title,
          active: true
        }])


      } else { // NOTE:: File Already opened
        const changed_file = getOpenFile(data.filepath) // automatically updates active file anyways if it's open

        if (!changed_file) return

        if (changed_file.text != data.text) {
          changed_file.text = data.text
          changed_file.unsaved_text = ""
          mermanEditorRef.current.reset()
        }

        if (changed_file.auto_render)
          render_merman(changed_file.filepath, data.text)

      }

    })
  }, [openFiles, activeFile, fileTabs])


  // TODO: add a file close method
  // WARNING: file close method is needed to stop file modify monitoring


  const file_open_action = () => {
    window.electron.ipcRenderer.send('file_open')
  }


  const file_close_action = (filepath_id: string) => {
    window.electron.ipcRenderer.send('file_close', filepath_id)


    // NOTE: ActiveFile set here
    if (filepath_id == activeFile.filepath) {
      const new_active_file = [...openFiles, blank_file].filter(
        file => file.filepath != filepath_id)
      [0]
      setActiveFile(new_active_file)
      setFileTabs(fileTabs.map((tab) => ( // set which tab is active
        { ...tab, active: new_active_file.filepath === tab.id })));
    }

    setOpenFiles(prev =>
      prev.filter(item => item.filepath != filepath_id))

    setFileTabs(prev => // remove closed tab for file tab display
      prev.filter(item => item.id != filepath_id))

  }

  useEffect(() => {
    window.electron.ipcRenderer.on("save_as_change", (_, data) => {
      const og = getOpenFile(data.old_filepath)
      const copy = getOpenFile(data.new_filepath)
      if (og && og.unsaved_text)
        og.unsaved_text = ""
      if (copy && copy.unsaved_text)
        copy.unsaved_text = ""
    })
  }, [openFiles])

  // NOTE: ---------- Tab Management


  const set_active_tab = (id: string) => {
    setFileTabs(fileTabs.map((tab) => (
      { ...tab, active: id === tab.id })));
    setActiveFile(getOpenFile(id))
  }


  // NOTE: ---------- Displaying Renders
  //

  const [refresher, setRefresher] = useState<number>(0)

  const mermanEditorRef = useRef({ get_text: () => " " });
  const mermanFileIconRef = useRef({
    indicateSaved: (_: boolean) => { }
  });
  const preprocessorRef = useRef({
    get_active_file_contents: () => { "" }
  })

  const render_merman = (
    specific_filepath, certain_text) => {

    const filepath_id = specific_filepath || activeFile.filepath

    window.electron.ipcRenderer.send('render', {
      filepath: filepath_id,
      merman: certain_text || mermanEditorRef.current.get_text(),
      request_id: Math.random().toString(36).substring(2),
      preprocessor: preprocessorRef.current.get_active_file_contents()
    })
  }

  useEffect(() => {
    window.electron.ipcRenderer.on("new_render_hash", (_, data) => {
      const update_file = getOpenFile(data.filepath)

      if (!update_file) return

      update_file.text_hash = data.hash
      setRefresher(prev => prev + 1)
    })
  }, [openFiles])


  useEffect(() => {
    window.electron.ipcRenderer.on("new_render_status", (_, data) => {
      const update_file = getOpenFile(data.filepath)

      console.log("render status", data.status)

      if (!update_file) return

      update_file.render_status = data.status
      setRefresher(refresher + 1)

      const setFavicon = () => {
        if (data.status == "done")
          return done_fav
        else if (data.status == "failed")
          return fail_fav
        else if (data.status == "running")
          return wait_fav
        else if (data.status == "preprocessing")
          return process_fav // TODO: replace with better icon for preprocessing
        else
          return none_fav
      }

      console.log("ACTIVE FILE RENDER STATUS", activeFile)

      setFileTabs(fileTabs.map(tab => ({
        ...tab,
        favicon: tab.id != data.filepath ?
          tab.favicon : setFavicon()
      })))
    })
  }, [openFiles, activeFile])




  useEffect(
    window.electron.ipcRenderer.on("new_render", (_, data) => {

      const update_file = getOpenFile(data.filepath)

      const image_types: Array<RenderImageType>
        = ["script", "summary", "sorted"]

      const doc_types: Array<RenderMDType>
        = ['todo', 'remember']


      if (!update_file)
        return console.log("file not found")


      if (image_types.includes(data.type)) { // new image
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

      }
      else if (doc_types.includes(data.type)) { // new markdown doc

        const new_markdown: RenderedMD = {
          text: data.text, hash: data.hash,
          render_status: "done"
        }

        if (data.type == "todo")
          update_file.todo = new_markdown
        if (data.type == "remember")
          update_file.remember = new_markdown
      }
      else { // Preprocessor Generated output
        update_file.preprocessed = {
          lines: data.lines,
          hash: data.hash,
          render_status: 'done'
        }
        // TODO: reset scroll here

      }

      setRefresher(prev => prev + 1) // refresh all image displays

    }),
    [openFiles]
  )


  // NOTE: ---------- console display



  window.electron.ipcRenderer.on("console_log",
    (_, data: ConsoleBufferLine) => {
      getOpenFile(data.filepath_id)?.console_buffer
        .add(JSON.stringify(data))
    }
  )

  window.electron.ipcRenderer.on("console_clear", (_, data) => {
    const target_file = getOpenFile(data.filepath_id)

    if (target_file)
      target_file.console_buffer = new Set()
  })

  // NOTE: ---------- UI color theme

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const prismTheme = useEditorTheme(theme == 'light' ?
    'prism' : 'dracula')

  useEffect(() => {
    const darkmode = `
      --color-text: #ddd;
      --color-background: #222436;
      --selected-tab-background: #000;
      scrollbar-color: #993399 #2d3034;
`
    const lightmode = `
      --color-text: #000;
      --color-background: #eee;
      --selected-tab-background: #fff;
`
    document.body.style = theme == 'light' ? lightmode : darkmode
  }, [theme])

  return (
    <>
      <style>{prismTheme}</style>
      <div style={{ height: '100vh' }}>
        <div className='FixedContainer'>
          <FileTabBar
            darkMode={theme == 'dark'}
            draggable
            onTabClose={file_close_action}
            onTabActive={set_active_tab}
            tabs={fileTabs}
            pinnedRight={
              <button
                style={{ height: "100%" }}
                onClick={() => {
                  file_open_action()
                }}>
                <FontAwesomeIcon icon={faFile} />
                <FontAwesomeIcon icon={faPlus} />
              </button>
            }
          />
        </div>

        <Tabs>
          <div className='FixedContainer'>
            <TabList>
              {/* replace with favicon component for the image and markdowntabs*/}
              <Tab>
                <CodeIcon
                  setSavedRef={mermanFileIconRef}
                />
                Write
              </Tab>
              <Tab>
                <TabIcon
                  activeFile={activeFile}
                  monitoredHash={activeFile.script.hash}
                  refresh={refresher}
                />
                Script
              </Tab>
              <Tab>
                <TabIcon
                  activeFile={activeFile}
                  monitoredHash={activeFile.summary.hash}
                  refresh={refresher}
                />
                Summary
              </Tab>
              <Tab>
                <TabIcon
                  activeFile={activeFile}
                  monitoredHash={activeFile.sorted.hash}
                  refresh={refresher}
                />
                Sorted
              </Tab>
              <Tab>
                <TabIcon
                  activeFile={activeFile}
                  monitoredHash={activeFile.todo.hash}
                  refresh={refresher}
                />
                Todo
              </Tab>
              <Tab>
                <TabIcon
                  activeFile={activeFile}
                  monitoredHash={activeFile.remember.hash}
                  refresh={refresher}
                />
                Remember
              </Tab>
              <Tab>
                <TabIcon
                  activeFile={activeFile}
                  monitoredHash={activeFile.preprocessed.hash}
                  refresh={refresher}
                />
                Processed
              </Tab>
              <Tab>
                Preprocessor
              </Tab>
              <Tab
                disabled={true}>
                <button
                  onClick={() => render_merman(null, null)}>
                  Render
                </button>
              </Tab>
              <Tab
                disabled={true}>
                <span
                  onClick={() => setTheme(prev =>
                    prev == 'light' ? 'dark' : 'light')}
                >
                  <img
                    src={theme == "light" ?
                      light_mode_icon : dark_mode_icon}
                    style={{ height: "2vh" }}
                  />
                </span>
                {/* <FontAwesomeIcon icon={faEnvelope} /> */}
              </Tab>
              {/* <button onClick={() => console.log(openFiles)}>test</button> */}
            </TabList>
          </div>

          <div className='contentPoint'></div>

          <TabPanel forceRender={true}> {/* Write */}
            <MermanEditor
              ActiveFile={activeFile}
              ref={mermanEditorRef}
              setSavedIcon={(show: boolean) =>
                mermanFileIconRef.current.indicateSaved(show)}
            />
          </TabPanel>
          <TabPanel > {/* Script */}
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
            <MarkdownViewer
              activeFile={activeFile}
              type="todo"
              refresh={refresher}
              theme={theme}
            />
          </TabPanel>
          <TabPanel> {/* Remember.md */}
            <MarkdownViewer
              activeFile={activeFile}
              type="remember"
              refresh={refresher}
              theme={theme}
            />
          </TabPanel>
          <TabPanel>
            <PreprocessorViewer
              activeFile={activeFile}
              refresh={refresher}
            />
          </TabPanel>
          <TabPanel forceRender={true}> {/* Preprocessor */}
            <PreprocessorManager
              activeFile={activeFile}
              ref={preprocessorRef}
            />
          </TabPanel>
        </Tabs >
      </div >

    </>
  )
}

export default App
