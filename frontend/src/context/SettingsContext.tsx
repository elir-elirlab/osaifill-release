import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  displayUnit: string;
  setDisplayUnit: (unit: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayUnit, setDisplayUnitState] = useState<string>(() => {
    // ローカルストレージから表示単位を取得、デフォルトは JPY とします
    return localStorage.getItem('osaifill_display_unit') || 'JPY';
  });

  const setDisplayUnit = (unit: string) => {
    setDisplayUnitState(unit);
    localStorage.setItem('osaifill_display_unit', unit);
  };

  return (
    <SettingsContext.Provider value={{ displayUnit, setDisplayUnit }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
