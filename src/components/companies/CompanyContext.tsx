'use client';

import { createContext, useContext } from 'react';

export interface CompanyContextValue {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    memberRole: 'owner' | 'admin' | 'member';
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({
    value,
    children,
}: {
    value: CompanyContextValue;
    children: React.ReactNode;
}) {
    return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany(): CompanyContextValue {
    const ctx = useContext(CompanyContext);
    if (!ctx) throw new Error('useCompany must be used inside a company route');
    return ctx;
}
