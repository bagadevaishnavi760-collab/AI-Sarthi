import { createContext, useContext, useState } from 'react';

// Global lightweight app state: sidebar visibility and demo-data indicator.
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [demoMode, setDemoMode] = useState(true); // true = mock data shown

  return (
    <AppContext.Provider value={{ sidebarOpen, setSidebarOpen, demoMode, setDemoMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
