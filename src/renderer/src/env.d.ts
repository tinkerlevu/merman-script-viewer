/// <reference types="vite/client" />
//
type EditorType = "javascript" | "merman";

type FileID = string

type OpenFIle = {
  filepath: FileID,
  text: string

}
