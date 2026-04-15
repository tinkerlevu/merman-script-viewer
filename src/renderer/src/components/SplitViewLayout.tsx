import { RefObject, useEffect, useRef, useState } from "react"
import ContentHeight from "./dynamicSize"
import { Element } from "mermaid/dist/diagrams/requirement/types.js"

export function SplitLayout(
  { mainContainerRef, handleMainScroll, children }: {
    mainContainerRef: RefObject<any>
    handleMainScroll: (_: any) => void
    children: any
  }
): React.JSX.Element {


  const Bar = children.find(child => child.type.name == 'FixedBar')
  const Top = children.find(child => child.type.name == 'SplitTop')
  const Bottom = children.find(c => c.type.name == 'SplitBottom')
  const Main = children.find(c => c.type.name == 'SplitMain')

  console.log(children, Top)

  const barRef = useRef(null)

  const [barHeight, setBarHeight] = useState<number>(0)

  useEffect(() => {
    setBarHeight(barRef.current?.clientHeight)

  }, [barRef.current?.clientHeight])


  // TODO: add a container at top called FixedBar for the buttons!
  return (<>


    <div style={{
      height: ContentHeight()
    }}>

      <div style={{
        width: "30%",
        display: 'inline-block',
        height: "100%"
      }}>
        <div ref={barRef}>
          {Bar} {/*<----------------------------- */}
        </div>
        <div style={{
          height: (ContentHeight() / 2) - barHeight,
          display: 'block',
          overflowY: 'scroll'
        }}>
          {Top} {/*<----------------------------- */}
        </div>
        <div style={{
          display: 'block',
          overflowY: 'scroll',
          height: '50%'
        }}>
          {Bottom} {/*<----------------------------- */}
        </div>
      </div>

      <div
        style={{
          height: '100%',
          width: "70%",
          display: 'inline-block',
          overflow: 'scroll'
        }}
        ref={mainContainerRef}
        onScroll={handleMainScroll}
      >
        {Main} {/*<----------------------------- */}
      </div>


    </div>
  </>)

}

export function FixedBar({ children }): React.JSX.Element {
  return <>{children}</>
}

export function SplitTop({ children }): React.JSX.Element {
  return <>{children}</>
}


export function SplitBottom({ children }): React.JSX.Element {
  return <>{children}</>
}

export function SplitMain({ children }): React.JSX.Element {
  return <>{children}</>
}
