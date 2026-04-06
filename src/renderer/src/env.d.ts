/// <reference types="vite/client" />
//
type EditorType = "javascript" | "merman";

type FileIDH = string

type RenderedImage = {
  svg: string,
  hash: string,
  render_status: "rendering" | "done" | "none"
}

type OpenFile = {
  filepath: FileID,
  text: string,
  text_hash: string,
  script: RenderedImage,
  summary: RenderedImage,
  sorted: RenderedImage

}
