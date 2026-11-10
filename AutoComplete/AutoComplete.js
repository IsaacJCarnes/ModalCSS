import { useEffect, useState } from "react";
import "./AutoComplete.css";
import useDebounce from "../Utility/useDebounce";

const Autocomplete = ({ suggestions, inputValue, setInputValue }) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const { debouncedValue } = useDebounce(inputValue, 250);

  useEffect(() => {
    if (!suggestions || !debouncedValue) {
      setFilteredSuggestions([]);
      return;
    }
    const filteredSuggestions = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(debouncedValue.toLowerCase()),
    );
    if (
      filteredSuggestions.length === 1 &&
      filteredSuggestions[0] === debouncedValue
    ) {
      setFilteredSuggestions([]);
    } else {
      setFilteredSuggestions(filteredSuggestions);
    }
  }, [debouncedValue, suggestions]);

  if (
    typeof inputValue === "undefined" ||
    typeof setInputValue === "undefined"
  ) {
    console.warn(
      "Could not setup autocomplete component, inputValue or setInputValue was undefined",
    );
    return <div>Broken Autocomplete</div>;
  }

  const handleSelect = (value) => {
    setInputValue(value);
  };

  return (
    <div className="autocompleteContainer">
      <input
        className="autocompleteInput"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type to search..."
      />
      <ul className="autocompleteSuggestions">
        {filteredSuggestions.map((suggestion, index) => (
          <li
            key={index}
            className="autocompleteSuggestion"
            onClick={() => handleSelect(suggestion)}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Autocomplete;
