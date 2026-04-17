import { RefObject, useState } from 'react'
import infoItems from '../assets/reference_info.json'
import { PrismEditor } from 'prism-react-editor'

// List of topics
// TODO: remove active file not needed?
export function ReferenceTopics(
  { activeFile, setInfoAbout, refreshEditor, editorRef }: {
    activeFile: OpenFile,
    setInfoAbout: (s: string) => void,
    refreshEditor: () => void,
    editorRef: RefObject<PrismEditor | null>,
  }) {

  const apply_example = (example_text) => {
    var text = editorRef.current?.value + '\n'

    var splitpoint = 0
    // find n=linenumber occurance of newline. giving start of next line
    for (var i = 0; i < editorRef.current?.activeLine; i++)
      splitpoint = text.indexOf('\n', splitpoint + 1)

    activeFile.unsaved_text =
      text.slice(0, splitpoint)
      + '\n\n' + example_text + '\n' +
      text.slice(splitpoint)

    refreshEditor()
  }

  const [selected, setSelected] = useState<string>("")


  return <ul>
    {infoItems.map(i =>
      <li
        key={i.title}
        onMouseEnter={() => setInfoAbout(i.title)}
        onMouseLeave={() => setInfoAbout(selected)}
        onMouseDown={() => setSelected(i.title)}
      // TODO: hover in css Style
      // TODO add class SelectedRefInfo as selected=i.title
      >
        {i.title}
        <button
          onClick={() => apply_example(i.example)}
        >
          {">"}
        </button>
      </li>)
    }
  </ul>
}

export function ReferenceDisplay(
  { topic }: {
    topic: string
  }) {

  const infoText = new Map(
    infoItems.map(i => [i.title, i.info]))

  const infoImages = new Map(
    infoItems.map(i => [i.title, i.image ? i.image.uri : null]))




  return <span>
    <p style={{ whiteSpace: 'pre-line' }}>
      {infoText.get(topic)}
    </p>
    <img
      style={{ width: "100%" }}
      src={infoImages.get(topic)}
    />
  </span>
}
//  select reference
//
//           you have general section topics like --Branching--, --Node Shapes--
//           which either inserts no examples or an example comment
//
//           and specific topics like :
//           Trapezoid
//           Rhombus
//
// //reference display

