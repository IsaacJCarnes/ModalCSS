import { useCallback, useEffect, useState } from "react";

const useLocalStorage = (storageName = "storedData") => {
  const [storage, setStorage] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const localStorage = window.localStorage.getItem(storageName);
      const localJson = localStorage ? JSON.parse(localStorage) : {};
      localJson && setStorage(localJson);
    } catch (e) {
      console.error(
        `Could not retrieve localStorage${e.message ? `\n${e.message}` : ""}`,
      );
    } finally {
      setIsLoaded(true);
    }
  }, [storageName]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(storageName, JSON.stringify(storage));
    } catch (e) {
      console.error(
        `Could not persist localStorage${e.message ? `\n${e.message}` : ""}`,
      );
    }
  }, [storage, storageName, isLoaded]);

  const setStorageItem = useCallback((name, value) => {
    setStorage((previousStorage) => {
      //If object has property with value already, return unchanged storage
      if (Object.is(previousStorage[name], value)) {
        return previousStorage;
      }
      return {
        ...previousStorage,
        [name]: value,
      };
    });
  }, []);

  const setStorageItems = useCallback((items) => {
    if (!items || typeof items !== "object" || Array.isArray(items)) {
      console.error("setStorageItems must be called with an object");
      return;
    }
    setStorage((previousStorage) => {
      const newStorage = {
        ...previousStorage,
        ...items,
      };

      if (
        Object.keys(items).every((key) =>
          Object.is(previousStorage[key], items[key]),
        )
      ) {
        return previousStorage;
      }

      return newStorage;
    });
  }, []);
  return { storageData: storage, setStorageItem, setStorageItems, isLoaded };
};

export default useLocalStorage;
