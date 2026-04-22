import failed from '../assets/favicons/failed.png'
import none from '../assets/favicons/none.png'
import loading from '../assets/favicons/loading.png'
import done from '../assets/favicons/done.png'


import { useEffect, useState } from "react"

export default function TabIcon(
  { activeFile, monitoredHash, refresh }: {
    activeFile: OpenFile,
    monitoredHash: string,
    refresh: number,
  }): React.JSX.Element {

  const [icon, setIcon] = useState<string>('') // TODO: replace with image url

  useEffect(() => {

    if (activeFile.render_status == "failed")
      setIcon(failed)
    else if (activeFile.render_status == "preprocessing")
      setIcon(loading)
    else if (activeFile.text_hash.length <= 0)
      setIcon(none)
    else if (monitoredHash != activeFile.text_hash)
      setIcon(loading)
    else if (monitoredHash == activeFile.text_hash)
      setIcon(done)
    else
      setIcon(none)

    console.log(activeFile.render_status)

  }, [
    activeFile,
    monitoredHash,
    refresh])

  return <span className='loading-tabicon'><img src={icon} style={{ maxHeight: "14px", paddingRight: "5px" }} /></span> // TODO:remove style


}
