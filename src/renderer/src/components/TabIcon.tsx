import { act, useEffect, useState } from "react"

export default function TabIcon(
  { activeFile, monitoredHash }: {
    activeFile: OpenFile,
    monitoredHash: String,
  }): React.JSX.Element {

  const [icon, setIcon] = useState<string>('') // TODO: replace with image url

  useEffect(() => {

    if (activeFile.render_status == "failed")
      setIcon('failed')
    else if (activeFile.text_hash.length <= 0)
      setIcon('none')
    else if (monitoredHash != activeFile.text_hash)
      setIcon('Loading')
    else if (monitoredHash == activeFile.text_hash)
      setIcon('Done')
    else
      setIcon('None')

  }, [activeFile.text_hash, activeFile.render_status, monitoredHash])

  return <>{icon}</> // TODO: wrap in image string

}
