/// <reference types="vite/client" />
//
type EditorType = "javascript" | "merman";

type FileIDH = string

type RenderImageType = "script" | "summary" | "sorted"

type RenderMDType = "todo" | "remember"

type RenderedImage = {
  svg: string,
  hash: string,
  render_status: "rendering" | "done" | "none"
}

type RenderedMD = {
  text: string,
  hash: string,
  render_status: "rendering" | "done" | "none"
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

}
