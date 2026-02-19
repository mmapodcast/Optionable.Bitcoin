
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ApiKeyProvider } from './contexts/ApiKeyContext.tsx';

// Explicitly unregister any existing service workers to prevent stale/broken caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch((err) => {
    console.error('Service worker unregistration failed:', err);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ApiKeyProvider>
        <App />
      </ApiKeyProvider>
    </AuthProvider>
  </React.StrictMode>
);
