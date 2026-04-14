import saved from "../assets/favicons/saved.png"
import unsaved from "../assets/favicons/unsaved.png"

import { useEffect, useState } from "react"


export default function CodeIcon(
  { setSavedRef }
): React.JSX.Element {

  const [icon, setIcon] = useState<string>('Saved')
  const [isSaved, setIsSaved] = useState<boolean>(false)

  setSavedRef.current.indicateSaved = setIsSaved

  useEffect(() => {
    if (isSaved)
      setIcon(saved)
    else
      setIcon(unsaved)
  }, [isSaved]
  )

  return <img src={icon} style={{ maxHeight: "14px", paddingRight: "5px" }} />  // TODO:remove style
}
