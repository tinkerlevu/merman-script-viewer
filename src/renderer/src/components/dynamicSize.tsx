
const getWindowHeight = () => {
  return document.documentElement.clientHeight;
}

const fixed_elements = document.getElementsByClassName("FixedContainer")


function getScrollbarWidth() {

  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);

  return scrollbarWidth;

}


// const OFFSET = 12; // NOTE: Pixel Offset

const calculate_new_height = () => {
  const viewport_height = getWindowHeight()

  // update measurements and calculations here
  //

  var used_space: number = 0;

  for (let item of fixed_elements) {
    used_space += item.clientHeight // + OFFSET
  }

  return viewport_height - used_space - getScrollbarWidth()

}



import { useEffect, useState } from "react";
const ContentHeight = () => {
  const [windowHeight, setWindowHeight] = useState([100]);

  useEffect(() => {
    const windowSizeHandler = () => {
      setWindowHeight([calculate_new_height()]);
    };
    window.addEventListener("resize", windowSizeHandler);


    // OTHER STUFF THAT RUNS AFTER INITIALIZATION
    windowSizeHandler()

    const interval = setInterval(() => {
      windowSizeHandler; clearInterval(interval)
    }, 1000);

    return () => {
    };
  }, []);


  return windowHeight[0];
};

export default ContentHeight;
