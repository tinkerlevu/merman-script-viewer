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
  line_num: number
}

type PrintLine = {
  content: string
  type: "plain" | "html"
}


type ProcessedLine = {
  source: string,
  line_num: number,
  generated: Array<GeneratedLine>,
  printed: Array<PrintLine>,
}
