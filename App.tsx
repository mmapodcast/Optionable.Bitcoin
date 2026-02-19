
import React from 'react';
import MainApp from './components/MainApp.tsx';

// The router has been removed to fix navigation issues.
// The entire app is now rendered within MainApp.
const App: React.FC = () => {
    return <MainApp />;
};

export default App;
