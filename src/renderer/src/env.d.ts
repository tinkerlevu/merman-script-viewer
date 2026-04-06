/// <reference types="vite/client" />
//
type EditorType = "javascript" | "merman";

type FileIDH = string

type OpenFile = {
  filepath: FileID,
  text: string
  //TODO: text_hash: md5 string, string of specific length

}
