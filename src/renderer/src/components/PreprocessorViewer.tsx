import { GeneratedLine, OpenFile, ProcessedLine, ProcessorPrintout } from "@renderer/env";
import { useEffect, useState } from "react";
import parse from 'html-react-parser';
import ContentHeight from "./dynamicSize";

import '../assets/processed_viewer.css'

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
      var type = line.line_num % 2 == 0 ? 'main-A' : 'main-B'

      tablerows.push(<>
        < tr
          className={type}
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
      <table className="processed-table">
        <colgroup>
          <col className="small-column" />
          <col className="big-column" />
          <col className="small-column" />
          <col className="big-column" />
          <col className="big-column" />
        </colgroup>
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
  var alternate = 1

  useEffect(() => {
    var tablerows: Array<any> = []
    for (const line of generated_lines) {
      tablerows.push(
        <tr
          className={alternate++ % 2 == 0 ? 'even' : 'odd'}
          key={line.line_num}
        // TODO: mark row as line.default in css
        >
          <td className={"generated-linenum "}>
            &nbsp;{line.line_num}&nbsp;
          </td>
          <td>
            {line.content}
          </td>
        </tr>
      )
    }
    setRows(tablerows)
  }, [generated_lines])


  return <table className='sub-table' >
    < colgroup >
      <col className="sub-table-number" />
      <col className="sub-table-text" />

    </ colgroup>
    {rows}
  </table>
}




function PrintoutTable(
  { printout_lines }: {
    printout_lines: Array<ProcessorPrintout>
  }) {
  const [rows, setRows] = useState<HTMLTableRowElement>()

  useEffect(() => {
    var tablerows: Array<any> = []
    var alternate = 1
    for (const line of printout_lines) {
      tablerows.push(
        <tr className={alternate++ % 2 == 0 ? 'even' : 'odd'}>
          <td>
            {line.type == "html" ? parse(line.content) : line.content}
          </td>

        </tr>
      )
    }
    setRows(tablerows)
  }, [printout_lines])


  return <table className="sub-table">
    <colgroup>
      <col className="sub-table-text" />
    </colgroup>
    {rows}
  </table>
}

