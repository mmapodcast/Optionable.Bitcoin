
import React, { useState, useEffect } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import type { DataProvider } from '../types';
import { validateApiKey } from '../services/marketDataService';
import { KeyIcon } from './icons/KeyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CoinIcon } from './icons/CoinIcon';

interface ProviderDetails {
    name: string;
    url: string;
    icon: React.ReactNode;
}

const providerDetails: { [key in DataProvider]: ProviderDetails } = {
    coinapi: { 
        name: 'CoinAPI.io', 
        url: 'https://www.coinapi.io/pricing?apikey',
        icon: <CoinIcon className="w-5 h-5" />,
    },
};

export const ApiKeyManager: React.FC = () => {
    const { apiKeys, activeProvider, setApiKey, setActiveProvider } = useApiKey();
    const [isOpen, setIsOpen] = useState(false);
    
    const availableProviders = (Object.keys(providerDetails) as DataProvider[]);
    const selectedProvider = availableProviders[0]; // Only one provider now

    const [inputValue, setInputValue] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationSuccess, setValidationSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setInputValue(apiKeys[selectedProvider] || '');
            setValidationError(null);
            setValidationSuccess(false);
        }
    }, [isOpen, selectedProvider, apiKeys]);
    
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        setValidationError(null);
        setValidationSuccess(false);
        setIsValidating(false);
    };

    const handleSave = async () => {
        const keyToValidate = inputValue.trim();
        if (!keyToValidate) {
            setValidationError("API Key cannot be empty.");
            return;
        }

        setValidationError(null);
        setValidationSuccess(false);
        setIsValidating(true);

        const isValid = await validateApiKey(selectedProvider, keyToValidate);
        setIsValidating(false);

        if (isValid) {
            setValidationSuccess(true);
            setApiKey(selectedProvider, keyToValidate);
            if (!activeProvider) {
                setActiveProvider(selectedProvider);
            }
        } else {
            setValidationError(`Invalid API Key for ${providerDetails[selectedProvider].name}. Please check the key and its format.`);
        }
    };
    
    const handleClear = () => {
        setApiKey(selectedProvider, null);
        setInputValue('');
        if (activeProvider === selectedProvider) {
            setActiveProvider(null);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isValidating) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (validationError) setValidationError(null);
        if (validationSuccess) setValidationSuccess(false);
    }
    
    const getButtonState = () => {
        if (!activeProvider || !apiKeys[activeProvider]) {
            return {
                text: 'Set API Key',
                className: 'bg-slate-700/80 border-slate-600 hover:bg-slate-600/80 text-slate-300',
                icon: <KeyIcon className="w-4 h-4" />
            }
        }
        if (activeProvider === 'coinapi') {
             return {
                text: 'CoinAPI Live',
                className: 'bg-amber-800/50 border-amber-700 hover:bg-amber-700/60 text-amber-300',
                icon: <CoinIcon className="w-4 h-4 text-amber-400" />
            }
        }
        return { text: 'Set API Key', className: 'bg-slate-700/80 border-slate-600 hover:bg-slate-600/80 text-slate-300', icon: <KeyIcon className="w-4 h-4" /> };
    }
    
    const buttonState = getButtonState();

    return (
        <>
            <button
                onClick={handleOpen}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md border transition-all ${buttonState.className}`}
                title="Manage Data Provider API Key"
            >
                {buttonState.icon}
                <span>{buttonState.text}</span>
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={handleClose}
                    aria-modal="true"
                    role="dialog"
                >
                    <div 
                        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold text-white mb-2">Manage Data Providers</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Enter your CoinAPI.io key to enable premium data features. Keys are stored in your browser.
                        </p>
                        
                        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-4">
                           <div className="w-full py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 bg-blue-600 text-white">
                                {providerDetails[selectedProvider].icon}
                                {providerDetails[selectedProvider].name}
                            </div>
                        </div>

                        <div className="mb-1">
                            <label htmlFor="api-key-input" className="sr-only">{providerDetails[selectedProvider].name} API Key</label>
                            <input
                                id="api-key-input"
                                type="password"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={`Paste your ${providerDetails[selectedProvider].name} key here`}
                                className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div className="h-6 mb-3 text-sm flex items-center gap-2">
                             {validationError && <p className="text-red-400 flex items-center gap-2"><XCircleIcon className="w-4 h-4" />{validationError}</p>}
                            {validationSuccess && <p className="text-green-400 flex items-center gap-2"><CheckIcon className="w-4 h-4" />API Key is valid and saved!</p>}
                        </div>

                        <p className="text-xs text-slate-500 mb-6">
                            {selectedProvider === 'coinapi' && <span>Key is validated by format only. </span>}
                            Get your API key from the{' '}
                            <a href={providerDetails[selectedProvider].url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                {providerDetails[selectedProvider].name} Dashboard
                            </a>.
                        </p>

                        <div className="flex flex-col sm:flex-row-reverse gap-3">
                             <button onClick={handleSave} disabled={isValidating || validationSuccess} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
                                {isValidating && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                <span>{isValidating ? 'Validating...' : 'Save Key'}</span>
                            </button>
                             <button onClick={handleClose} className="w-full sm:w-auto bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors mr-auto">
                                Close
                            </button>
                            {apiKeys[selectedProvider] && (
                                <button onClick={handleClear} className="w-full sm:w-auto bg-transparent text-red-400 font-semibold py-2 px-2 rounded-md hover:bg-red-900/40 transition-colors text-sm">
                                    Clear Key
                                </button>
                            )}
                        </div>
                         {activeProvider === selectedProvider && (
                            <div className="mt-4 text-center text-sm text-green-400 bg-green-900/30 border border-green-800 rounded-md py-2">
                                This is your current active data provider.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
