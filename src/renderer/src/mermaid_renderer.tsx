// import './assets/main.css'
// import './assets/base.css'

import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'




function Renderer(): React.JSX.Element {
  const init = useEffect(() => {
    console.log('hello init')
    window.electron.ipcRenderer.send('renderer_initalized', 'payload')
  })

  return (
    <>
      <br /> popoptpptptptptsptp
    </>
  )
}



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    hello worold lsdkfjsdlfkjsdj
    <Renderer />
  </StrictMode>
)

