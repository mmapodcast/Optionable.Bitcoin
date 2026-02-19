
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { DataProvider, ApiKeys } from '../types';

interface ApiKeyContextType {
  apiKeys: ApiKeys;
  activeProvider: DataProvider | null;
  setApiKey: (provider: DataProvider, key: string | null) => void;
  setActiveProvider: (provider: DataProvider | null) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

const API_KEYS_STORAGE_KEY = 'optionable-api-keys';
const ACTIVE_PROVIDER_STORAGE_KEY = 'optionable-active-provider';

const initialApiKeys: ApiKeys = { coinapi: null };

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKeys, setApiKeysState] = useState<ApiKeys>(initialApiKeys);
  const [activeProvider, setActiveProviderState] = useState<DataProvider | null>(null);

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        // Add a check to ensure parsedKeys is a non-null object before proceeding
        if (parsedKeys && typeof parsedKeys === 'object') {
            const newKeys: ApiKeys = { coinapi: parsedKeys.coinapi || null };
            setApiKeysState(newKeys);
        } else {
            // Data is corrupt (e.g., stored as 'null' string), clear it.
            throw new Error("Stored API keys are not a valid object.");
        }
      }
      const storedProvider = localStorage.getItem(ACTIVE_PROVIDER_STORAGE_KEY) as DataProvider | null;
      if (storedProvider && Object.keys(initialApiKeys).includes(storedProvider)) {
        setActiveProviderState(storedProvider);
      }
    } catch (error) {
      console.error("Could not read API config from localStorage. Clearing corrupted data.", error);
      // If there's any error in parsing or reading, clear the corrupted data to prevent future crashes
      localStorage.removeItem(API_KEYS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_PROVIDER_STORAGE_KEY);
    }
  }, []);

  const setApiKey = useCallback((provider: DataProvider, key: string | null) => {
    setApiKeysState(prevKeys => {
      const newKeys = { ...prevKeys, [provider]: key };
      try {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(newKeys));
      } catch (error) {
        console.error("Could not save API keys to localStorage", error);
      }
      return newKeys;
    });
  }, []);

  const setActiveProvider = useCallback((provider: DataProvider | null) => {
    setActiveProviderState(provider);
    try {
      if (provider) {
        localStorage.setItem(ACTIVE_PROVIDER_STORAGE_KEY, provider);
      } else {
        localStorage.removeItem(ACTIVE_PROVIDER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save active provider to localStorage", error);
    }
  }, []);

  const contextValue = useMemo(() => ({ apiKeys, activeProvider, setApiKey, setActiveProvider }), [apiKeys, activeProvider, setApiKey, setActiveProvider]);

  return (
    <ApiKeyContext.Provider value={contextValue}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
