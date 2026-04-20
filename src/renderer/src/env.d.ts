/// <reference types="vite/client" />

import { Hash } from "crypto";

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
  hash: Hash | string,
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
  text_hash: Hash | string,
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
  preprocessed: RenderedProcessedLines
}

type ConsoleBufferLine = {
  filepath_id: FileID,
  text: string,
  hash: Hash | string
}

type GeneratedLine = {
  content: string // as shown in table display not index
  line_num: number
}

type ProcessorPrintout = {
  content: string
  type: "plain" | "html"  // add error here
}


type ProcessedLine = {
  source: string,
  line_num: number, // as shown in table display not index
  generated: Array<GeneratedLine>,
  printed: Array<PrintLine>,
  error: null | {
    type: "merman" | "preprocessor",
    message: string
  }
}

RenderedProcessedLines = {
  lines: Array<ProcessedLine>,
  hash: Hash | string, // FIX: set type to hash without causing errors in app.tsx
  render_status: "rendering" | "done" | "none"
}

