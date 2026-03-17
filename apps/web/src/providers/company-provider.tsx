import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'aicompany:companyId';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function readStoredId(): string | null {
  const v = localStorage.getItem(STORAGE_KEY);
  return v && UUID_RE.test(v) ? v : null;
}

interface CompanyContextValue {
  companyId: string | null;
  setCompanyId: (id: string) => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [companyId, setCompanyIdState] = useState<string | null>(readStoredId);

  function setCompanyId(id: string): void {
    localStorage.setItem(STORAGE_KEY, id);
    setCompanyIdState(id);
  }

  return (
    <CompanyContext.Provider value={{ companyId, setCompanyId }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompanyContext must be used within CompanyProvider');
  return ctx;
}
