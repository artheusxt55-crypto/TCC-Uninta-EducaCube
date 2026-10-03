import { useEffect, useState } from "react";

export type PerformanceMode = "full" | "reduced" | "minimal";

type NavigatorWithExtras = Navigator & {
  connection?: {
    saveData?: boolean;
  };
  deviceMemory?: number;
};

export function usePerformanceMode(): PerformanceMode {
  const [mode, setMode] = useState<PerformanceMode>("full");

  useEffect(() => {
    const updateMode = () => {
      const nav = navigator as NavigatorWithExtras;

      const mobile = window.matchMedia(
        "(max-width: 768px)"
      ).matches;

      const cores = nav.hardwareConcurrency || 8;
      const memory = nav.deviceMemory;
      const saveData = nav.connection?.saveData === true;

        
                          
        
                                               
                                                  
                                 
         
      if (saveData) {
        setMode("minimal");
        return;
      }

        
                                
        
                                                
                                       
         
      if (
        cores <= 2 ||
        (memory !== undefined && memory <= 2)
      ) {
        setMode("minimal");
        return;
      }

        
                                  
         
      if (
        cores <= 4 ||
        (memory !== undefined && memory <= 4)
      ) {
        setMode("reduced");
        return;
      }

        
                        
        
                                                
                                               
                                            
         
      if (mobile) {
        setMode("full");
        return;
      }

        
                                   
         
      setMode("full");
    };

    updateMode();

    window.addEventListener("resize", updateMode);

    return () => {
      window.removeEventListener("resize", updateMode);
    };
  }, []);

  return mode;
}
