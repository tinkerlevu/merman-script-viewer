import { GeneratedLine, OpenFile, ProcessedLine, ProcessorPrintout } from "@renderer/env";
import { act, useEffect, useRef, useState } from "react";
import parse from 'html-react-parser';
import ContentHeight from "./dynamicSize";
import { highlightText } from "prism-react-editor/prism";


//TODO: highlightText()


import '../assets/processed_viewer.css'
import { MermanLanguage } from "./CodeEditor";

const cache = new Map()

const manage_cache = () => {
  if (cache.size > 30)
    Array.from(cache.keys())
      .slice(0, 10)
      .forEach(hash => cache.delete(hash))
}

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

    if (activeFile.preprocessed.hash != 'pending') {
      tablerows = cache.get(activeFile.preprocessed.hash)

      if (tablerows) {
        setProcessedRows(tablerows)
        console.log("CACHE", activeFile.preprocessed.hash, tablerows)
        return
      }
      tablerows = []
    }
    console.log("RUNNNNNNNING")


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
            {parse(
              highlightText(line.source, MermanLanguage)
            )}
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
    cache.set(activeFile.preprocessed.hash, tablerows)
    manage_cache()
    setProcessedRows(tablerows)
    console.log("CURRENT CACHE", cache)
  }, [activeFile, activeFile.preprocessed.lines, cache])


  // Scrolling
  const divRef = useRef(null)

  useEffect(() => {
    if (!divRef.current) return
    console.log('restoring', activeFile.scroll_pos.processed.scroll)
    divRef.current.scrollTop =
      activeFile.scroll_pos.processed.scroll

  }, [divRef.current, activeFile, processedRows])


  const handleScroll = (_) => {
    if (!divRef.current) return
    activeFile.scroll_pos.processed.scroll = divRef.current?.scrollTop
  }


  //  END of Scrolling



  return <>
    <div
      style={container_style}
      ref={divRef}
      onScroll={handleScroll}
    >
      <table className="processed-table">
        <colgroup>
          <col className="small-column" />
          <col className="big-column" />
          <col className="small-column" />
          <col className="big-column" />
          <col className="big-column" />
        </colgroup>
        <tbody>
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
        </tbody>
      </table>
    </div>
  </>
}


function GeneratedLinesTable(
  { generated_lines }: {
    generated_lines: Array<GeneratedLine>
  }): React.JSX.Element {

  const [rows, setRows] = useState<HTMLTableRowElement>()
  var alternate_gen = 1

  useEffect(() => {
    var tablerows: Array<any> = []
    for (const line of generated_lines) {
      tablerows.push(
        <tr
          className={alternate_gen++ % 2 == 0 ? 'odd' : 'even'}
          key={line.line_num}
        // TODO: mark row as line.default in css
        >
          <td className={"generated-linenum "}>
            &nbsp;{line.line_num}&nbsp;
          </td>
          <td>
            {parse(
              highlightText(line.content, MermanLanguage)
            )}
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
    <tbody>    {rows}</tbody>

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
        <tr className={alternate++ % 2 == 1 ? 'odd' : 'even'}>
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
    <tbody>
      {rows}
    </tbody>
  </table>
}

