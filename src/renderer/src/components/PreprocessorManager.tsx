import { useRef } from "react";
import CodeEditor from "./CodeEditor";
import { FixedBar, SplitBottom, SplitLayout, SplitMain, SplitTop } from "./SplitViewLayout";

export default function PreprocessorManager(
  { }: {
  }): React.JSX.Element {


  const containerRef = useRef(null)


  return <SplitLayout
    mainContainerRef={containerRef}
    handleMainScroll={() => { }}
  >

    <FixedBar>
      <button>New</button>
      <button>Open</button>
      <button>Save</button>
      <button >Save As</button>
      <input type="checkbox" /> Skip (disable for this file)
    </FixedBar>

    <SplitTop>
      file selector
    </SplitTop>

    <SplitBottom ref={null}>
      console
    </SplitBottom>

    <SplitMain>
      <CodeEditor type="javascript"
        value={""}
        onUpdate={() => { }}
      />

      implement file loading into map and show contents here
    </SplitMain>


  </SplitLayout >
}



// runs function which passes an object as variable STATIC to be called over multiple lines!
// a single preprocessor file can be linked to multiple open scripts
// list of open preprocessor files that can be assigned to this file with -None- / default option
