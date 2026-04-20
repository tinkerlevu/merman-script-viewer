import { BrowserWindow } from "electron"
import { FSWatcher, PathOrFileDescriptor } from "fs"


type FileID = string

type Hash = string


type AssignedRenderWindow = {
  bWindow: BrowserWindow,
  mmn_filepath: string
}

type MonitoredFile = {
  filepath: string, // acts as like an id to identify this script in several places within the app
  handle: number, // FileDescriptor int
}

type RenderJob = {
  text: string,
  filepath_id: string
  timestamp: DOMHighResTimeStamp
  preprocessor: string
}


type GeneratedLine = {
  content: string
  line_num: number // as shown in table display not index
  default: boolean // true if preprocessor returned "" and the existing merman line was passed through
}

type ProcessorPrintout = {
  content: string
  type: "plain" | "html"  // add error here
}


type ProcessedLine = {
  source: string,
  line_num: number, // as shown in table display not index
  generated: Array<GeneratedLine>,
  printed: Array<ProcessorPrintout>,
  error: null | {
    type: "merman" | "preprocessor",
    message: string
  }
}
