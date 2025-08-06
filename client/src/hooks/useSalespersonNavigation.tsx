import { useLocation } from "wouter";
import { useSalesperson } from "@/contexts/SalespersonContext";

export const useSalespersonNavigation = () => {
  const [, setLocation] = useLocation();
  const { salespersonId } = useSalesperson();

  const navigateWithSalesperson = (path: string) => {
    if (salespersonId) {
      // Preserve salesperson ID in URL for continued tracking
      const separator = path.includes('?') ? '&' : '?';
      const newPath = `${path}${separator}salesperson_id=${salespersonId}`;
      console.log('🔗 Navigating with salesperson tracking:', newPath);
      setLocation(newPath);
    } else {
      console.log('🔗 Navigating without salesperson tracking:', path);
      setLocation(path);
    }
  };

  return { navigateWithSalesperson };
};