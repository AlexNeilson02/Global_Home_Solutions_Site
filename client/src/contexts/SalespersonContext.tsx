import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SalespersonContextType {
  salespersonId: number | null;
  setSalespersonId: (id: number | null) => void;
  clearSalesperson: () => void;
}

const SalespersonContext = createContext<SalespersonContextType | undefined>(undefined);

export const useSalesperson = () => {
  const context = useContext(SalespersonContext);
  if (context === undefined) {
    throw new Error('useSalesperson must be used within a SalespersonProvider');
  }
  return context;
};

interface SalespersonProviderProps {
  children: ReactNode;
}

export const SalespersonProvider: React.FC<SalespersonProviderProps> = ({ children }) => {
  const [salespersonId, setSalespersonId] = useState<number | null>(null);

  // Initialize salesperson tracking ONLY when QR parameters are present
  useEffect(() => {
    const initializeSalesperson = async () => {
      // Check URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const salespersonIdParam = urlParams.get('salesperson_id');
      const refParam = urlParams.get('ref');
      
      // CRITICAL: Only proceed if QR parameters are present
      if (!salespersonIdParam && !refParam) {
        // Clear any existing session data when no QR parameters present
        sessionStorage.removeItem('salespersonId');
        setSalespersonId(null);
        console.log('🚫 No QR parameters - cleared any existing salesperson tracking');
        return;
      }
      
      if (salespersonIdParam) {
        // Direct salesperson_id parameter
        const id = parseInt(salespersonIdParam);
        if (!isNaN(id)) {
          setSalespersonId(id);
          sessionStorage.setItem('salespersonId', id.toString());
          console.log('✅ Salesperson ID tracked globally:', id);
          return;
        }
      } 
      
      if (refParam) {
        // QR code ref parameter - lookup salesperson
        console.log('✅ QR code ref parameter found globally:', refParam);
        try {
          const response = await fetch(`/api/salesperson/${refParam}`);
          if (response.ok) {
            const data = await response.json();
            if (data.salesperson) {
              setSalespersonId(data.salesperson.id);
              sessionStorage.setItem('salespersonId', data.salesperson.id.toString());
              console.log('✅ Salesperson ID from QR ref tracked globally:', data.salesperson.id);
              return;
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not find salesperson for ref:', refParam);
        }
      }
      
      // If we reach here with QR params but failed to set up tracking
      console.log('⚠️ QR parameters present but salesperson tracking failed');
    };

    initializeSalesperson();
  }, []);

  const clearSalesperson = () => {
    setSalespersonId(null);
    sessionStorage.removeItem('salespersonId');
    console.log('🗑️ Cleared salesperson tracking');
  };

  const updateSalespersonId = (id: number | null) => {
    setSalespersonId(id);
    if (id) {
      sessionStorage.setItem('salespersonId', id.toString());
      console.log('✅ Updated salesperson tracking:', id);
    } else {
      sessionStorage.removeItem('salespersonId');
      console.log('🗑️ Cleared salesperson tracking');
    }
  };

  return (
    <SalespersonContext.Provider value={{
      salespersonId,
      setSalespersonId: updateSalespersonId,
      clearSalesperson
    }}>
      {children}
    </SalespersonContext.Provider>
  );
};