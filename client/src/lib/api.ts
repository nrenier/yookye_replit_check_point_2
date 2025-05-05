// client/src/lib/api.ts
import axios from "axios";
import type { z } from "zod";
import { format } from "date-fns";

// Definizione del tipo FormValues
export type FormValues = {
  passioni: string[];
  luoghiDaNonPerdere: string;
  luoghiSpecifici?: string[];
  tipoDestinazioni: string;
  ritmoViaggio: string;
  livelloSistemazione: string;
  tipologiaSistemazione: string[];
  numAdulti: string | number;
  numBambini: string | number;
  numNeonati: string | number;
  numCamere: string | number;
  tipologiaViaggiatore: string;
  checkInDate: Date;
  checkOutDate: Date;
  localitaArrivoPartenza: string;
  descrizioneArrivoPartenza?: string;
  budget: string;
  noteAggiuntive?: string;
  email: string;
};

// Usa l'URL del server REST esterno se disponibile, altrimenti fallback su /api
const API_URL = import.meta.env.VITE_TRAVEL_API_URL || "/api";
const API_USERNAME = import.meta.env.VITE_TRAVEL_API_USERNAME;
const API_PASSWORD = import.meta.env.VITE_TRAVEL_API_PASSWORD;

console.log("Variabili ambiente API:", {
  url: API_URL,
  username: API_USERNAME ? "definito" : "non definito",
  password: API_PASSWORD ? "definito" : "non definito",
});

console.log("URL API utilizzato:", API_URL);

// Token e timestamp di scadenza
let accessToken: string | null = null;
let tokenExpiryTime = 0;

// Funzione per ottenere un token valido
const getAccessToken = async (): Promise<string> => {
  // Se il token esiste ed è ancora valido (considerando 5 minuti di margine)
  if (accessToken && tokenExpiryTime > Date.now() + 300000) {
    console.log(
      "Utilizzo token esistente, valido fino a:",
      new Date(tokenExpiryTime).toISOString(),
    );
    return accessToken;
  }

  // Altrimenti richiediamo un nuovo token
  try {
    // Usa endpoint locale per autenticazione
    const tokenEndpoint = `/api/auth/login`;
    console.log("Richiedo nuovo token di accesso all'endpoint:", tokenEndpoint);

    // Verifica che le variabili d'ambiente siano definite
    if (!API_USERNAME || !API_PASSWORD) {
      console.warn(
        "Variabili d'ambiente VITE_TRAVEL_API_USERNAME o VITE_TRAVEL_API_PASSWORD non definite, utilizzo utente locale.",
      );
      // Tenta di autenticare con il sistema locale
      const response = await axios.post(
        tokenEndpoint,
        {
          username: "admin", // Usa credenziali di default o configurate localmente
          password: "password"
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Salva il token dal sistema locale
      if (response.data && response.data.data && response.data.data.access_token) {
        accessToken = response.data.data.access_token;
        tokenExpiryTime = Date.now() + (60 * 60 * 1000); // 1 ora di default
        console.log("Token locale ottenuto con successo");
        return accessToken;
      }
    } else {
      // Tenta con le credenziali dell'API esterna se sono disponibili
      const externalTokenEndpoint = `${API_URL}/api/auth/token`;
      console.log("Richiedo token esterno all'endpoint:", externalTokenEndpoint);

      const response = await axios.post(
        externalTokenEndpoint,
        new URLSearchParams({
          username: API_USERNAME,
          password: API_PASSWORD,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Salva il token e imposta la scadenza
      accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 60 * 60; // seconds
      tokenExpiryTime = Date.now() + expiresIn * 1000; // milliseconds
      console.log(
        "Token esterno ottenuto con successo. Scadenza:",
        new Date(tokenExpiryTime).toISOString(),
      );

      return accessToken;
    }

    throw new Error("Nessun token ricevuto");
  } catch (error) {
    console.error("Errore nell'ottenere il token:", error);
    // Log dettagliato dell'errore Axios se disponibile
    if (axios.isAxiosError(error)) {
      console.error("Dettagli errore token:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });
    }

    // Fallback in caso di errore - tentativo con l'endpoint alternativo
    try {
      // Se il tentativo esterno fallisce, prova con il sistema locale
      if (API_URL && API_URL !== "/api") {
        console.log("Tentativo fallback con autenticazione locale");
        const response = await axios.post(
          "/api/auth/login",
          {
            username: "admin", // Usa credenziali di default
            password: "password"
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && response.data.data && response.data.data.access_token) {
          accessToken = response.data.data.access_token;
          tokenExpiryTime = Date.now() + (60 * 60 * 1000); // 1 ora di default
          console.log("Token locale di fallback ottenuto con successo");
          return accessToken;
        }
      }
    } catch (fallbackError) {
      console.error("Anche il fallback ha fallito:", fallbackError);
    }

    throw new Error("Impossibile ottenere il token di autenticazione");
  }
};

// Function to make authenticated API requests to the EXTERNAL API (using API_URL)
export const apiRequest = async (method: string, url: string, data?: any) => {
  try {
    const token = await getAccessToken();
    const headers: any = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const config = {
      method: method.toLowerCase(),
      url: `${API_URL}${url}`, // Use API_URL as base for external API calls
      headers,
      timeout: 300000, // Aumento timeout a 5 minuti (300000 ms) per evitare timeout 504
      data: data ? data : undefined, // Include data for POST/PUT/PATCH
    };

    console.log("Effettuo richiesta API (External):", config);

    const response = await axios(config);

    console.log("Risposta API (External) ricevuta:", response);
    return response;

  } catch (error) {
    console.error(`Errore durante la richiesta API (External) ${method.toUpperCase()} ${url}:`, error);
     if (axios.isAxiosError(error)) {
      console.error("Dettagli errore Axios (External):", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data, // Log request body if available
        },
      });
    }
    throw error; // Re-throw the error to be handled by the caller
  }
};


// NEW Function to make authenticated API requests to the LOCAL BACKEND (/api)
const LOCAL_API_BASE_URL = "/api"; // Use /api as the base for the local backend

// Funzione per recuperare i pacchetti salvati
export const getSavedPackages = async () => {
  try {
    const response = await localApiRequest("GET", "/saved-packages");
    if (!response.ok) {
      throw new Error("Errore nel recupero dei pacchetti salvati");
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Errore nel recupero dei pacchetti salvati:", error);
    throw error;
  }
};

export const localApiRequest = async (method: string, url: string, data?: any, responseType: 'json' = 'json') => {
  try {
    // Assuming local backend also uses JWT authentication with the same token
    // If not, you might need a different auth mechanism or no auth for local endpoints
    const token = await getAccessToken(); // Reuse getAccessToken for local auth

    const headers: any = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const config = {
      method: method.toLowerCase(),
      url: `${LOCAL_API_BASE_URL}${url}`, // Use LOCAL_API_BASE_URL for local backend calls
      headers,
      timeout: 120000, // Aumento timeout a 2 minuti (120000 ms) 
      data: data ? data : undefined,
    };

    console.log("Effettuo richiesta API (Local):", config);

    const response = await axios(config);

    console.log("Risposta API (Local) ricevuta:", response);
    return response;

  } catch (error) {
    console.error(`Errore durante la richiesta API (Local) ${method.toUpperCase()} ${url}:`, error);

// Funzione per recuperare l'itinerario dettagliato
export const getDetailedItinerary = async (jobId: string) => {
  try {
    const response = await localApiRequest("GET", `/api/saved-packages/itinerary?job_id=${jobId}`);
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dell'itinerario dettagliato:", error);
    throw error;
  }
};

// Funzione per recuperare i pacchetti personali dal profilo
export const getMyPackages = async () => {
  try {
    const response = await localApiRequest("GET", "/api/saved-packages/my-packages");
    if (!response.data.success) {
      throw new Error("Errore nel recupero dei pacchetti salvati");
    }
    return response.data.data || [];
  } catch (error) {
    console.error("Errore nel recupero dei pacchetti personali:", error);
    throw error;
  }
};

     if (axios.isAxiosError(error)) {
      console.error("Dettagli errore Axios (Local):", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data, // Log request body if available
        },
      });
    }
    throw error; // Re-throw the error
  }
};


// Funzione per controllare lo stato del job di ricerca
export const checkJobStatus = async (jobId: string) => {
  // This endpoint seems related to the external API search job
  // Keep using apiRequest for this one
  const response = await apiRequest("GET", `/api/search/${jobId}`);
  console.log("Stato del job:", response.data);
  return response.data;
};

// Funzione per ottenere i risultati del job di ricerca
export const getJobResults = async (jobId: string) => {
  // This endpoint also seems related to the external API search job results
  // Keep using apiRequest for this one
  const response = await apiRequest("GET", `/api/search/${jobId}/result`);
  console.log("Risultati ricevuti:", response.data);
  return response.data;
};


// Mappa i dati del form al formato richiesto dall'API di ricerca (come definito nello Swagger)
const mapFormToSearchInput = (formData: FormValues) => {
  // Mappa interessi in categorie e sottocategorie
  const mapInterests = () => {
    const interessi: any = {
      storia_e_arte: {
        siti_archeologici: false,
        musei_e_gallerie: false,
        monumenti_e_architettura: false,
      },
      "Food_&_wine": {
        visite_alle_cantine: false,
        soggiorni_nella_wine_country: false,
        corsi_di_cucina: false,
      },
      vacanze_attive: {
        trekking_di_più_giorni: false,
        tour_in_e_bike_di_più_giorno: false,
        tour_in_bicicletta_di_più_giorni: false,
        sci_snowboard_di_più_giorni: false,
      },
      vita_locale: false,
      salute_e_benessere: false,
    };

    // Attiva le categorie selezionate
    formData.passioni?.forEach((interesse) => {
      // Mappa direttamente i valori alle chiavi corrispondenti
      switch(interesse) {
        // Storia e arte
        case "archeologia":
          interessi.storia_e_arte.siti_archeologici = true;
          break;
        case "musei":
          interessi.storia_e_arte.musei_e_gallerie = true;
          break;
        case "architettura":
          interessi.storia_e_arte.monumenti_e_architettura = true;
          break;

        // Food & Wine
        case "cantine":
          interessi["Food_&_wine"].visite_alle_cantine = true;
          break;
        case "wine_country":
          interessi["Food_&_wine"].soggiorni_nella_wine_country = true;
          break;
        case "corsi_cucina":
          interessi["Food_&_wine"].corsi_di_cucina = true;
          break;

        // Vacanze attive
        case "trekking":
          interessi.vacanze_attive.trekking_di_più_giorni = true;
          break;
        case "ebike":
          interessi.vacanze_attive.tour_in_e_bike_di_più_giorni = true;
          break;
        case "bicicletta":
          interessi.vacanze_attive.tour_in_bicicletta_di_più_giorni = true;
          break;
        case "sci":
          interessi.vacanze_attive.sci_snowboard_di_più_giorni = true;
          break;

        // Altre categorie
        case "local_life":
          interessi.vita_locale = true;
          break;
        case "benessere":
          interessi.salute_e_benessere = true;
          break;

        // Mappatura legacy per retrocompatibilità
        case "enogastronomia":
          interessi["Food_&_wine"].visite_alle_cantine = true;
          break;
        case "sport":
          interessi.vacanze_attive.sci_snowboard_di_più_giorni = true;
          break;
        case "cultura":
          interessi.vita_locale = true;
          break;
      }
    });

    return interessi;
  };

  return {
    interessi: mapInterests(),
    luoghi_da_non_perdere: {
      luoghi_specifici: formData.luoghiDaNonPerdere === "si",
      city:
        formData.luoghiDaNonPerdere === "si" && formData.luoghiSpecifici && formData.luoghiSpecifici.length > 0
          ? formData.luoghiSpecifici[0]
          : "",
    },
    mete_clou: {
      destinazioni_popolari: formData.tipoDestinazioni === "popolari",
      destinazioni_avventura: formData.tipoDestinazioni === "avventura", // Check if this mapping is correct based on your backend API
      entrambe: formData.tipoDestinazioni === "entrambi",
    },
    ritmo_ideale: {
      veloce: formData.ritmoViaggio === "veloce",
      moderato: formData.ritmoViaggio === "moderato",
      rilassato: formData.ritmoViaggio === "rilassato",
    },
    sistemazione: {
      livello: {
        fascia_media: formData.livelloSistemazione === "media", // Corrected mapping
        boutique: formData.livelloSistemazione === "boutique",
        eleganti: formData.livelloSistemazione === "lusso", // Corrected mapping
      },
      tipologia: {
        hotel: formData.tipologiaSistemazione?.includes("hotel") || false,
        "b&b": formData.tipologiaSistemazione?.includes("bb") || false,
        agriturismo:
          formData.tipologiaSistemazione?.includes("agriturismo") || false,
        villa: formData.tipologiaSistemazione?.includes("villa") || false,
        appartamento:
          formData.tipologiaSistemazione?.includes("appartamento") || false,
        glamping: formData.tipologiaSistemazione?.includes("glamping") || false,
      },
    },
    viaggiatori: {
      adults_number: Number(formData.numAdulti) || 2,
      children_number: Number(formData.numBambini) || 0,
      baby_number: Number(formData.numNeonati) || 0,
      Room_number: Number(formData.numCamere) || 1,
    },
    tipologia_viaggiatore: {
      family: formData.tipologiaViaggiatore === "famiglia",
      coppia: formData.tipologiaViaggiatore === "coppia",
      amici: formData.tipologiaViaggiatore === "amici",
      single: false, // Assuming 'single' is a distinct category if not covered by others
      azienda: formData.tipologiaViaggiatore === "azienda", // Corrected mapping
    },
    date: {
      check_in_time:
        formData.checkInDate instanceof Date
          ? format(formData.checkInDate, 'yyyy-MM-dd') // Format date as YYYY-MM-DD
          : "",
      check_out_time:
        formData.checkOutDate instanceof Date
          ? format(formData.checkOutDate, 'yyyy-MM-dd') // Format date as YYYY-MM-DD
          : "",
    },
    trasporti: {
      conosci_arrivo_e_partenza: formData.localitaArrivoPartenza === "si",
      description:
        formData.localitaArrivoPartenza === "si"
          ? formData.descrizioneArrivoPartenza
          : "",
      auto_propria: formData.localitaArrivoPartenza === "auto" || false,
      Unknown: formData.localitaArrivoPartenza === "non_so" || false,
    },
    budget_per_persona_giorno: {
      economico: formData.budget === "economy",
      fascia_media: formData.budget === "mid_range",
      comfort: formData.budget === "comfort",
      lusso: formData.budget === "luxury",
      nessun_budget: formData.budget === "no_limit", // Corrected mapping
    },
    esigenze_particolari: formData.noteAggiuntive || null,
  };
};


export const submitPreferences = async (preferenceData: FormValues) => {
  try {
    // This call is for the external API search
    const response = await apiRequest("POST", "/api/search", mapFormToSearchInput(preferenceData));

    console.log("Risposta ricevuta dall'endpoint /search:", response.data);

    // Salva anche il record delle preferenze nel sistema locale (opzionale e separato dalla chiamata API esterna)
    try {
      // Use localApiRequest for this authenticated call to the local backend
      await localApiRequest("POST", "/api/preferences", preferenceData);
      console.log("Preferenze salvate localmente con successo.");
    } catch (prefError) {
      console.warn(
        "Errore nel salvataggio delle preferenze locali:",
        prefError,
      );
      // Continuiamo comunque perché l'operazione principale è la ricerca
    }

    // Log di debug per monitorare la risposta dell'API esterna
    console.log(`Risposta ricevuta dall'API esterna (${API_URL}): `, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    // Dopo aver ricevuto il job_id, reindirizza alla pagina dei risultati
    // La pagina dei risultati si occuperà del polling
    if (response.data && response.data.job_id) {
      const jobId = response.data.job_id;
      // Salva l'email dell'utente e il job_id nel localStorage per poter ripristinare la sessione
      localStorage.setItem('yookve_job_id', jobId);
      localStorage.setItem('token', await getAccessToken()); // Salva il token nel localStorage

      // Se disponibile, salva l'email per poter identificare l'utente
      if (preferenceData.email) {
        localStorage.setItem('yookve_user_email', preferenceData.email);
      }

      // Redirect alla pagina dei risultati
      window.location.href = `/results?job_id=${jobId}`;

      // Previeni ulteriori operazioni dopo il redirect
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error submitting preferences:", error);

    // Log dettagliato dell'errore per il debugging
    if (axios.isAxiosError(error)) {
      console.error("Dettagli errore Axios:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data, // Log request body if available
        },
      });
      // Aggiungi un log specifico se l'errore corrisponde a quelli noti
      if (error.response?.data && typeof error.response.data === "object") {
        const apiError = error.response.data as any;
        if (apiError.code === "INVALID_JSON_FORMAT" && apiError.errors) {
          console.error(
            "Errori di validazione API specifici:",
            apiError.errors,
          );
        }
      }
    }

    throw error; // Rilancia l'errore per essere gestito dal chiamante
  }
};

// Call the new backend endpoint to save the package with proper authentication
export const savePackage = async (packageData: any) => {
    try {
        console.log("Sending saved package request with token:", localStorage.getItem("token")?.substring(0, 15) + "...");
        const res = await localApiRequest("POST", "/api/saved-packages", packageData);
        return res.data;
    } catch (error) {
        console.error("Error saving package:", error);
        throw error;
    }
}