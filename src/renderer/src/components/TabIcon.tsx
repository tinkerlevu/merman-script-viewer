import { act, useEffect, useState } from "react"

export default function TabIcon(
  { activeFile, monitoredHash }: {
    activeFile: OpenFile,
    monitoredHash: String,
  }): React.JSX.Element {

  const [icon, setIcon] = useState<string>('') // TODO: replace with image url

  useEffect(() => {

    if (monitoredHash.length <= 0)
      setIcon('none')
    else if (monitoredHash != activeFile.text_hash)
      setIcon('Loading')
    else if (monitoredHash == activeFile.text_hash)
      setIcon('Done')
    else
      setIcon('None')

  }, [activeFile.text_hash, monitoredHash])

  return <>{icon} {monitoredHash} {activeFile.text_hash}</> // TODO: wrap in image string

}
