import { BrowserWindow } from "electron"
import { FSWatcher, PathOrFileDescriptor } from "fs"

type AssignedRenderWindow = {
  bWindow: BrowserWindow,
  mmn_filepath: string
}

type MonitoredFile = {
  filepath: string, // acts as like an id to identify this script in several places within the app
  handle: number, // FileDescriptor int
}

type RenderJob = {
  merman_text: string,
  filepath: string
}
