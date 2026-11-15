import "./ModalCSS.css";

import { useEffect, useState, useMemo } from "react";
import useDebounce from "./Utility/useDebounce";
import useInitialCSSVariables from "./Utility/useInitialCSSVariables";
import Autocomplete from "./AutoComplete/AutoComplete";
import useLocalStorage from "./Utility/useLocalStorage";

// Checks whether a stored property has a usable name and value before it is displayed or applied.
const validPair = (propertyOption) =>
  propertyOption &&
  typeof propertyOption === "object" &&
  typeof propertyOption.name === "string" &&
  propertyOption.name.length > 0 &&
  // The key check preserves falsy values such as an empty string; nullish values are rejected separately.
  "value" in propertyOption &&
  propertyOption.value != null;

//targetProperties = [{name:"", value:"", options?:[""]}]
const ModalCSS = ({
  targetElement = document.documentElement,
  targetProperties = [],
  pictureOptions = [],
}) => {
  // Track panel initialization and the current search text for autocomplete.
  const [isLoaded, setIsLoaded] = useState(false);
  const [autocompleteInput, setAutocompleteInput] = useState("");

  // Read page CSS variables for defaults and suggestions.
  const { initialCSSVars, isLoaded: initialCSSLoaded } =
    useInitialCSSVariables();

  // Load ModalCSS data and provide the function used to update it.
  const {
    storageData,
    setStorageItem,
    isLoaded: localStorageLoaded,
  } = useLocalStorage("ModalCSS");

  // Keep only well-formed property entries from persisted data.
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

  // Delay applying edits so rapid input changes only update the target after typing pauses.
  const { debouncedValue } = useDebounce(storedCSS);

  // Memoize suggestions so Autocomplete does not refilter on unrelated renders.
  const cssVariableNames = useMemo(
    () => Object.keys(initialCSSVars),
    [initialCSSVars],
  );

  // Wait for both sources to load, then merge configured properties with saved values.
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
      // Saved values survive reloads, while configured options remain authoritative.
      propertiesByName[property.name] = {
        ...configured,
        ...property,
        value: property.value ?? configured.value,
        options: configured.options ?? property.options,
      };
    });

    const newProps = Object.values(propertiesByName);

    // Fill unset values from the CSS variables, allows for targetProperties to be sent in without a value
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

  // Apply valid debounced values to the target, skipping values that are already set.
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

  // Selects the appropriate input based on configured options or the property's current value.
  const getRelatedInput = (propertyOption, index) => {
    // String conversion lets the same checks handle numeric and missing values safely.
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

  // Adds a property to persisted settings unless its name is empty or already present.
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

  // Updates one property's value while preserving every other stored property.
  const changeProperty = (value, index) => {
    // Rebuild the array immutably and clone only the entry being changed.
    const newProps = storedCSS.map((prevVal, i) => {
      if (i === index) {
        return { ...prevVal, value: value };
      } else {
        return prevVal;
      }
    });
    setStorageItem("cssProps", newProps);
  };

  // Adds the selected CSS variable using its discovered page value as the initial setting.
  const addAutocompleteProperty = () => {
    const propertyName = autocompleteInput.trim();
    if (
      !propertyName ||
      storedCSS.some((property) => property.name === propertyName)
    ) {
      return;
    }
    // Keep an empty editable value when the variable has no discovered declaration value.
    const targetProp = initialCSSVars[propertyName] ?? "";
    addPropertyTarget(propertyName, targetProp);
    setAutocompleteInput("");
  };

  const PropertyInputs = () => {
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
        {PropertyInputs()}
      </aside>
    </div>
  );
};

export default ModalCSS;
