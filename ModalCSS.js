import "./ModalCSS.css";

import { useEffect, useState, useMemo } from "react";
import useDebounce from "./Utility/useDebounce";
import useInitialCSSVariables from "./Utility/useInitialCSSVariables";
import Autocomplete from "./AutoComplete/AutoComplete";
import useLocalStorage from "./Utility/useLocalStorage";

const validPair = (propertyOption) =>
  propertyOption &&
  typeof propertyOption === "object" &&
  typeof propertyOption.name === "string" &&
  propertyOption.name.length > 0 &&
  "value" in propertyOption &&
  propertyOption.value != null;

//targetProperties = [{name:"", value:"", options?:[""]}]
const ModalCSS = ({
  targetElement = document.documentElement,
  targetProperties = [],
  pictureOptions = [],
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [autocompleteInput, setAutocompleteInput] = useState("");

  const { initialCSSVars, isLoaded: initialCSSLoaded } =
    useInitialCSSVariables();
  const {
    storageData,
    setStorageItem,
    isLoaded: localStorageLoaded,
  } = useLocalStorage("ModalCSS");
  const storedCSS = useMemo(() => {
    const cssProps = storageData["cssProps"];
    return Array.isArray(cssProps)
      ? cssProps.filter(
          (property) =>
            property &&
            typeof property === "object" &&
            typeof property.name === "string",
        )
      : [];
  }, [storageData]);
  const { debouncedValue } = useDebounce(storedCSS);
  const cssVariableNames = useMemo(
    () => Object.keys(initialCSSVars),
    [initialCSSVars],
  );

  useEffect(() => {
    if (!localStorageLoaded || !initialCSSLoaded) {
      return;
    }

    const configuredProperties = {};
    targetProperties.forEach((property) => {
      if (property && typeof property.name === "string" && property.name) {
        configuredProperties[property.name] = {
          ...configuredProperties[property.name],
          ...property,
        };
      }
    });

    const propertiesByName = { ...configuredProperties };
    storedCSS.forEach((property) => {
      const configured = configuredProperties[property.name] ?? {};
      propertiesByName[property.name] = {
        ...configured,
        ...property,
        value: property.value ?? configured.value,
        options: configured.options ?? property.options,
      };
    });

    const newProps = Object.values(propertiesByName);

    newProps.forEach((property, index) => {
      if (
        property["value"] === undefined &&
        initialCSSVars[property["name"]] !== undefined
      ) {
        newProps[index]["value"] = initialCSSVars[property["name"]];
      }
    });

    if (JSON.stringify(newProps) !== JSON.stringify(storedCSS)) {
      setStorageItem("cssProps", newProps);
    }
    setIsLoaded(true);
  }, [
    targetProperties,
    initialCSSVars,
    localStorageLoaded,
    initialCSSLoaded,
    setStorageItem,
    storedCSS,
  ]);

  useEffect(() => {
    if (!isLoaded || !debouncedValue) {
      return;
    }
    debouncedValue.forEach((propertyOption) => {
      if (
        validPair(propertyOption) &&
        targetElement.style.getPropertyValue(propertyOption.name) !==
          propertyOption.value
      )
        targetElement.style.setProperty(
          propertyOption.name,
          propertyOption.value,
        );
    });
  }, [debouncedValue, targetElement, isLoaded]);

  const getRelatedInput = (propertyOption, index) => {
    const propValue = String(propertyOption.value ?? "");
    const propOptions = propertyOption.options;
    if (propOptions) {
      return (
        <select
          value={String(propertyOption.value ?? "")}
          onChange={(e) => changeProperty(e.target.value, index)}
        >
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
            value={String(propertyOption.value ?? "")}
            onInput={(e) => changeProperty(e.target.value, index)}
          />
          <input
            type="text"
            name={propertyOption.name}
            value={String(propertyOption.value ?? "")}
            onChange={(e) => changeProperty(e.target.value, index)}
          />
        </div>
      );
    } else if (propValue.includes("png") || propValue.includes("jpg")) {
      return (
        <select
          value={String(propertyOption.value ?? "")}
          onChange={(e) => changeProperty(e.target.value, index)}
        >
          {pictureOptions.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        name={propertyOption.name}
        value={String(propertyOption.value ?? "")}
        onChange={(e) => changeProperty(e.target.value, index)}
      />
    );
  };

  const getPropertyInputs = () => {
    if (!isLoaded) return <></>;
    return storedCSS.map(
      (propertyOption, index) =>
        validPair(propertyOption) && (
          <div key={propertyOption.name}>
            <div>{propertyOption.name}:</div>
            {getRelatedInput(propertyOption, index)}
          </div>
        ),
    );
  };

  const addPropertyTarget = (name, value, options = undefined) => {
    const normalizedName = name.trim();
    if (
      !normalizedName ||
      storedCSS.some((property) => property.name === normalizedName)
    ) {
      return;
    }
    const newProps = [...storedCSS, { name: normalizedName, value, options }];
    setStorageItem("cssProps", newProps);
  };

  const changeProperty = (value, index) => {
    const newProps = storedCSS.map((prevVal, i) => {
      if (i === index) {
        return { ...prevVal, value: value };
      } else {
        return prevVal;
      }
    });
    setStorageItem("cssProps", newProps);
  };

  const addAutocompleteProperty = () => {
    const propertyName = autocompleteInput.trim();
    if (
      !propertyName ||
      storedCSS.some((property) => property.name === propertyName)
    ) {
      return;
    }
    const targetProp = initialCSSVars[propertyName] ?? "";
    addPropertyTarget(propertyName, targetProp);
    setAutocompleteInput("");
  };

  return (
    <div id="ModalArea">
      <aside
        id="ModalCSS"
        className={
          (storageData["isExtended"] ?? false) && isLoaded ? "active" : ""
        }
      >
        <button
          id="ModalExtender"
          onClick={() => {
            if (!isLoaded) return;
            setStorageItem("isExtended", !Boolean(storageData["isExtended"]));
          }}
        >
          <div>{"<"}</div>
        </button>
        <div className="autocompleteContainer">
          <Autocomplete
            suggestions={cssVariableNames}
            inputValue={autocompleteInput}
            setInputValue={setAutocompleteInput}
          />
          <button
            disabled={
              !autocompleteInput.trim() ||
              storedCSS.some(
                (property) => property.name === autocompleteInput.trim(),
              )
            }
            onClick={addAutocompleteProperty}
          >
            Add Variable
          </button>
        </div>
        {getPropertyInputs()}
      </aside>
    </div>
  );
};

export default ModalCSS;
