import { GeneratedLine, OpenFile, ProcessedLine, ProcessorPrintout } from "@renderer/env";
import { useEffect, useState } from "react";
import parse from 'html-react-parser';
import ContentHeight from "./dynamicSize";



export default function PreprocessorViewer(
  { activeFile, refresher }: {
    activeFile: OpenFile,
    refresher: number
  }): React.JSX.Element {

  const container_style = {
    overflow: "scroll",
    height: ContentHeight(),
    width: "100%"
  }

  const [processedRows, setProcessedRows] =
    useState<HTMLTableRowElement>([])

  useEffect(() => {
    var tablerows: Array<any> = []
    for (const line of activeFile.preprocessed.lines) {

      var error: any = null
      if (line.error) {
        error = <tr>
          <td
            colSpan={4}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {line.error.message}
          </td>
        </tr>
      }

      tablerows.push(<>
        < tr
          key={line.line_num}
        >
          <td>
            {line.line_num}
          </td>
          <td>
            {line.source}
          </td>
          <td>
            <GeneratedLinesTable
              generated_lines={line.generated}
            />
          </td>
          <td>
            <PrintoutTable
              printout_lines={line.printed}
            />
          </td>
        </tr >
        {error}
      </>
      )
    }
    setProcessedRows(tablerows)
  }, [activeFile, activeFile.preprocessed.lines])



  return <>
    <div
      style={container_style}
    >
      <table>
        <tr>
          <th colSpan={2}>
            Source
          </th>
          <th>
            Generated
          </th>
          <th>
            Console Output
          </th>
        </tr>
        {processedRows}
      </table>
    </div>
  </>
}


function GeneratedLinesTable(
  { generated_lines }: {
    generated_lines: Array<GeneratedLine>
  }): React.JSX.Element {

  const [rows, setRows] = useState<HTMLTableRowElement>()

  useEffect(() => {
    var tablerows: Array<any> = []
    for (const line of generated_lines) {
      tablerows.push(
        <tr
          key={line.line_num}
        // TODO: mark row as line.default in css
        >
          <td>
            {line.line_num}
          </td>
          <td>
            {line.content}
          </td>
        </tr>
      )
    }
    setRows(tablerows)
  }, [generated_lines])


  return <table>{rows}</table>
}




function PrintoutTable(
  { printout_lines }: {
    printout_lines: Array<ProcessorPrintout>
  }) {
  const [rows, setRows] = useState<HTMLTableRowElement>()

  useEffect(() => {
    var tablerows: Array<any> = []
    for (const line of printout_lines) {
      tablerows.push(
        <tr>
          <td>
            {line.type == "html" ? parse(line.content) : line.content}
          </td>

        </tr>
      )
    }
    setRows(tablerows)
  }, [printout_lines])


  return <table>{rows}</table>
}

