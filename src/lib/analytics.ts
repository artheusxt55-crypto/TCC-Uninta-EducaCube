const GA_MEASUREMENT_ID = "G-3ZRNDZFYER";

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

let analyticsInicializado = false;

   
                                            
  
                                            
                                                        
   
function prepararGtag() {
    if (typeof window === "undefined") return;

    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag !== "function") {
        window.gtag = function (...args: any[]) {
            window.dataLayer.push(args);
        };
    }
}

   
                                              
   
export function recusarAnalytics() {
    if (typeof window === "undefined") return;

    prepararGtag();

    window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
    });

    console.log("🚫 Analytics recusado.");
}

   
                                                                   
   
export function aceitarAnalytics() {
    if (typeof window === "undefined") return;

    prepararGtag();

                                           
    window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
    });

                                    
    if (analyticsInicializado) {
        console.log("📊 Analytics já estava inicializado.");
        return;
    }

      
                                                  
                                
       
    window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: true,
        anonymize_ip: true,
    });

    analyticsInicializado = true;

    console.log(
        "📊 Google Analytics inicializado:",
        GA_MEASUREMENT_ID
    );

      
                       
                                                
                                        
       
    window.gtag("event", "analytics_teste", {
        origem: "educacube",
    });

    console.log("📤 analytics_teste enviado.");
}

   
                                   
   
export function registrarEvento(
    nome: string,
    parametros?: Record<string, any>
) {
    if (typeof window === "undefined") return;

    if (!analyticsInicializado) {
        console.warn(
            "⚠️ Evento não enviado porque o Analytics ainda não foi aceito/inicializado:",
            nome
        );

        return;
    }

    window.gtag(
        "event",
        nome,
        parametros || {}
    );

    console.log(
        "📤 Evento enviado:",
        nome
    );
}
