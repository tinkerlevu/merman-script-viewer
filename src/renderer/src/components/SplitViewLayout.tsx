import { RefObject } from "react"
import ContentHeight from "./dynamicSize"
import { Element } from "mermaid/dist/diagrams/requirement/types.js"

export function SplitLayout(
  { mainContainerRef, handleMainScroll, children }: {
    mainContainerRef: RefObject<HTMLDivElement>
    handleMainScroll: (_: any) => void
    children: any
  }
): React.JSX.Element {




  const Top = children.find(child => child.type.name == 'SplitTop')
  const Bottom = children.find(c => c.type.name == 'SplitBottom')
  const Main = children.find(c => c.type.name == 'SplitMain')

  console.log(children, Top)

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
        <div style={{
          height: ContentHeight() / 2,
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


export function SplitTop({ children }): React.JSX.Element {
  return <>{children}</>
}


export function SplitBottom({ children }): React.JSX.Element {
  return <>{children}</>
}

export function SplitMain({ children }): React.JSX.Element {
  return <>{children}</>
}
