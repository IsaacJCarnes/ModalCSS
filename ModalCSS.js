import "./ModalCSS.css";

import { useEffect, useState } from "react";
import useDebounce from "./Utility/useDebounce";
import useInitialCSSVariables from "./Utility/useGetCSSVariables";
import Autocomplete from "./AutoComplete/AutoComplete";

//targetProperties = [{name:"", value:"", options?:[""]}]
const ModalCSS = ({
  targetElement = document.documentElement,
  targetProperties = [],
}) => {
  const [isExtended, setIsExtended] = useState(false);
  const [propertyTargets, setPropertyTargets] = useState([]);
  const [autocompleteInput, setAutocompleteInput] = useState("");
  const { debouncedValue } = useDebounce(propertyTargets);
  const initialCSSVars = useInitialCSSVariables();

  useEffect(() => {
    const newProps = [...targetProperties];
    targetProperties.forEach((property, index) => {
      if (
        property["value"] === undefined &&
        initialCSSVars[property["name"]] !== undefined
      ) {
        newProps[index]["value"] = initialCSSVars[property["name"]];
      }
    });
    setPropertyTargets(newProps);
  }, [targetProperties, initialCSSVars]);

  useEffect(() => {
    if (!debouncedValue) {
      return;
    }

    debouncedValue.forEach(
      (propertyOption) =>
        validPair(propertyOption) &&
        targetElement.style.setProperty(
          propertyOption.name,
          propertyOption.value,
        ),
    );
  }, [debouncedValue, targetElement]);

  const getRelatedInput = (propertyOption, index) => {
    const propValue = String(propertyOption.value);
    const propOptions = propertyOption.options;
    if (propOptions) {
      return (
        <select onChange={(e) => changeProperty(e.target.value, index)}>
          {propOptions.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    } else if (propValue.includes("#")) {
      return (
        <div>
          <input
            type="color"
            name={propertyOption.name}
            value={propertyOption.value}
            onInput={(e) => changeProperty(e.target.value, index)}
          />
          <input
            type="text"
            name={propertyOption.name}
            value={propertyOption.value}
            onChange={(e) => changeProperty(e.target.value, index)}
          />
        </div>
      );
    }
    return (
      <input
        name={propertyOption.name}
        defaultValue={propertyOption.value}
        onChange={(e) => changeProperty(e.target.value, index)}
      />
    );
  };

  const addPropertyTarget = (name, value, options = undefined) => {
    setPropertyTargets((prevProperties) => {
      return [...prevProperties, { name, value, options }];
    });
  };

  const changeProperty = (value, index) => {
    setPropertyTargets((prevTargets) => {
      return prevTargets.map((prevVal, i) => {
        if (i === index) {
          return { ...prevVal, value: value };
        } else {
          return prevVal;
        }
      });
    });
  };

  const addAutocompleteProperty = () => {
    var targetProp = initialCSSVars[autocompleteInput] || "";
    addPropertyTarget(autocompleteInput, targetProp);
    setAutocompleteInput("");
  };

  const validPair = (propertyOption) => {
    return propertyOption && propertyOption.name && propertyOption.value;
  };

  return (
    <div id="ModalArea">
      <aside id="ModalCSS" className={isExtended ? "active" : ""}>
        <button
          id="ModalExtender"
          onClick={(e) => {
            setIsExtended((prevVal) => !prevVal);
          }}
        >
          <div>{"<"}</div>
        </button>
        <div className="autocompleteContainer">
          <Autocomplete
            suggestions={Object.keys(initialCSSVars)}
            inputValue={autocompleteInput}
            setInputValue={setAutocompleteInput}
          />
          <button onClick={addAutocompleteProperty}>Add Variable</button>
        </div>
        {debouncedValue.map(
          (propertyOption, index) =>
            validPair(propertyOption) && (
              <div key={index}>
                <div>{propertyOption.name}:</div>
                {getRelatedInput(propertyOption, index)}
              </div>
            ),
        )}
      </aside>
    </div>
  );
};

export default ModalCSS;
