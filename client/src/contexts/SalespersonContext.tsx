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

  // Initialize salesperson tracking from URL or sessionStorage on app load
  useEffect(() => {
    const initializeSalesperson = async () => {
      // Check URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const salespersonIdParam = urlParams.get('salesperson_id');
      const refParam = urlParams.get('ref');
      
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
      
      // CRITICAL FIX: Only restore from sessionStorage if URL has salesperson parameters
      // This prevents false attribution when users visit without QR codes
      const hasQRParams = salespersonIdParam || refParam;
      if (hasQRParams) {
        // Check sessionStorage for existing salesperson tracking only when QR params present
        const storedSalespersonId = sessionStorage.getItem('salespersonId');
        if (storedSalespersonId) {
          const id = parseInt(storedSalespersonId);
          if (!isNaN(id)) {
            setSalespersonId(id);
            console.log('✅ Restored salesperson tracking from session:', id);
            return;
          }
        }
      } else {
        // Clear any existing session data when no QR parameters present
        sessionStorage.removeItem('salespersonId');
        setSalespersonId(null);
        console.log('🚫 No QR parameters - cleared any existing salesperson tracking');
      }
      
      console.log('ℹ️ No salesperson parameter - no commission assignment');
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