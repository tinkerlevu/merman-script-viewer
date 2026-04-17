/// <reference types="vite/client" />
//
type EditorType = "javascript" | "merman";

type FileID = string

type Hash = string

type RenderImageType = "script" | "summary" | "sorted"

type RenderedImage = {
  svg: string,
  hash: Hash,
  render_status: "rendering" | "done" | "none"
}

type RenderMDType = "todo" | "remember"

type RenderedMD = {
  text: string,
  hash: Hash,
  render_status: "rendering" | "done" | "none"
}


type GraphPos = { // scroll and zoom position for flowcharts
  zoom: number,
  scroll_y: number, // ratio of 1 to 0
  scroll_x: number
}


type DocPos = { // scroll position for markdown documents
  scroll: number,
}


type BookmarkState = 'empty' | 'filled' | 'eraseable' | 'disabled'


type OpenFile = {
  filepath: FileID,
  text: string,
  unsaved_text: string,
  text_hash: Hash,
  render_status: "running" | "done" | "failed" | "none" | "preprocessing"
  script: RenderedImage,
  summary: RenderedImage,
  sorted: RenderedImage,
  todo: RenderedMD,
  remember: RenderedMD,
  auto_render: boolean,
  scroll_pos: {
    script: GraphPos,
    summary: GraphPos,
    sorted: GraphPos,
    todo: DocPos,
    remember: DocPos,
    merman: DocPos,
  },
  bookmarks: Map<GraphPos>, // !! not able to be converted to JSON
  console_buffer: Set<string> // console display in bottom left
}

type ConsoleBufferLine = {
  filepath_id: FileID,
  text: string,
  hash: Hash
}
