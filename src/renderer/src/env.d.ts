/// <reference types="vite/client" />
//
type EditorType = "javascript" | "merman";

type FileIDH = string

type RenderImageType = "script" | "summary" | "sorted"

type RenderedImage = {
  svg: string,
  hash: string,
  render_status: "rendering" | "done" | "none"
}

type RenderMDType = "todo" | "remember"

type RenderedMD = {
  text: string,
  hash: string,
  render_status: "rendering" | "done" | "none"
}


type GraphPos = { // scroll and zoom position for flowcharts
  zoom: number,
}


type DocPos = { // scroll position for markdown documents
  scroll: number,
}

type OpenFile = {
  filepath: FileID,
  text: string,
  text_hash: string,
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
  }

}
