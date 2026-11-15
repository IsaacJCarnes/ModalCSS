import { useEffect, useState } from "react";

const useInitialCSSVariables = () => {
  const [initialCSSVars, setIntialCSSVars] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const variables = {};
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules || []).forEach((rule) => {
          if (rule.style) {
            Array.from(rule.style).forEach((prop) => {
              if (prop.startsWith("--")) {
                variables[prop] = rule.style.getPropertyValue(prop).trim();
              }
            });
          }
        });
      } catch (e) {
        // Catch cross-origin stylesheet access errors
        console.warn("Cannot access stylesheet:", sheet.href);
      }
    });
    setIntialCSSVars(variables);
    setIsLoaded(true)

    return(() => {
      setIsLoaded(true)
    })
  }, []);
  return {initialCSSVars, isLoaded};
};

export default useInitialCSSVariables;
