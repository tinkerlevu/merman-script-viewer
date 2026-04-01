import Versions from './components/Versions'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <button type="button" onClick={ipcHandle}>Ping</button>
      <Versions></Versions>
    </>
  )
}

export default App
