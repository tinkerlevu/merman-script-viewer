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

}
