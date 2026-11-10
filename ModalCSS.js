import "./ModalCSS.css";

import { useEffect, useState } from "react";
import useDebounce from "./useDebounce";

function ModalCSS({
  targetElement = document.documentElement,
  targetProperties = {},
}) {
  const [isExtended, setIsExtended] = useState(false);
  const [propertyTargets, setPropertyTargets] = useState([]);
  const { debouncedValue } = useDebounce(propertyTargets);

  useEffect(() => {
    const cssTargets = Object.entries(targetProperties);
    if (!cssTargets || cssTargets.length === 0) {
      console.error("cssTargets is undefined or empty.");
      return;
    }
    setPropertyTargets(cssTargets);
  }, [targetProperties]);

  useEffect(() => {
    console.log(debouncedValue);
    if (!debouncedValue || debouncedValue.length === 0) {
      return;
    }

    debouncedValue.forEach(
      (pair) =>
        validPair(pair) && targetElement.style.setProperty(pair[0], pair[1]),
    );
  }, [debouncedValue]);

  const getRelatedInput = (pair, index) => {
    const propValue = String(pair[1]);
    if (propValue.includes("#")) {
      return (
        <div>
          <input
            type="color"
            name={pair[0]}
            defaultValue={pair[1]}
            onChange={(e) => changeProperty(e.target.value, index)}
          />
          <input
            type="text"
            name={pair[0]}
            defaultValue={pair[1]}
            onChange={(e) => changeProperty(e.target.value, index)}
          />
        </div>
      );
    }
  };

  const changeProperty = (value, index) => {
    setPropertyTargets((prevTargets) => {
      return prevTargets.map((prevVal, i) => {
        if (i === index) {
          return [prevVal[0], value];
        } else {
          return prevVal;
        }
      });
    });
  };

  const validPair = (pair) => {
    return pair && pair.length == 2;
  };

  return (
    <div id="ModalArea">
      <aside id="ModalCSS" className={isExtended ? "active" : ""}>
        <button
          id="ModalExtender"
          onClick={(e) => {console.log("Click"); setIsExtended((prevVal) => !prevVal)}}
        >
          <div>{"<"}</div>
        </button>
        {debouncedValue.map(
          (pair, index) =>
            validPair(pair) && (
              <div key={index}>
                {pair[0]}:{getRelatedInput(pair, index)}
              </div>
            ),
        )}
      </aside>
    </div>
  );
}

export default ModalCSS;
