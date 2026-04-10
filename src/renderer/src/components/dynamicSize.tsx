
const getWindowHeight = () => {
  return document.documentElement.clientHeight;
}

const fixed_elements = document.getElementsByClassName("FixedContainer")


const OFFSET = 10; // NOTE: Pixel Offset

const calculate_new_height = () => {
  const viewport_height = getWindowHeight()

  // update measurements and calculations here
  //

  var used_space: number = 0;

  for (let item of fixed_elements) {
    used_space += item.getBoundingClientRect().height + OFFSET
  }

  return viewport_height - used_space

}



import { useEffect, useState } from "react";
const ContentHeight = () => {
  const [windowHeight, setWindowHeight] = useState([
    100
  ]);

  useEffect(() => {
    const windowSizeHandler = () => {
      setWindowHeight([calculate_new_height()]);
    };
    window.addEventListener("resize", windowSizeHandler);

    // OTHER STUFF THAT RUNS AFTER INITIALIZATION
    windowSizeHandler()

    return () => {
      window.removeEventListener("resize", windowSizeHandler);
    };
  }, [fixed_elements]);


  return windowHeight[0];
};

export default ContentHeight;
