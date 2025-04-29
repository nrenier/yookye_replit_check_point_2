import axios from "axios";
import type { z } from "zod"; // z is imported but not used in the provided snippet. Keeping it as is.
import { format } from "date-fns";

// Definizione del tipo FormValues
export type FormValues = {
  passioni: string[];
  luoghiDaNonPerdere: string; // Assuming this is the destination city name
  luoghiSpecifici?: string[]; // Assuming a string describing specific places
  tipoDestinazioni: string; // This field doesn't seem directly mapped to the API schema
  ritmoViaggio: string;
  livelloSistemazione: string;
  tipologiaSistemazione: string[];
  numAdulti: string | number;
  numBambini: string | number;
  numNeonati: string | number;
  numCamere: string | number; // This field doesn't seem directly mapped to the API schema
  tipologiaViaggiatore: string;
  checkInDate: Date;
  checkOutDate: Date;
  localitaArrivoPartenza: string; // Assuming this is used for the city name and potentially indicates known arrival/departure
  descrizioneArrivoPartenza?: string; // Assuming details about arrival/departure points
  budget: string;
  noteAggiuntive?: string;
  email: string; // This field doesn't seem directly mapped to the API schema
};

// Usa l'URL del server REST esterno se disponibile, altrimenti fallback su /api
const API_URL = import.meta.env.VITE_TRAVEL_API_URL || "/api"; // External REST API URL from .env
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
    const tokenEndpoint = `${API_URL}/api/auth/token`;
    console.log("Richiedo nuovo token di accesso all'endpoint:", tokenEndpoint);

    // Verifica che le variabili d'ambiente siano definite
    if (!API_USERNAME || !API_PASSWORD) {
      throw new Error(
        "Variabili d'ambiente VITE_TRAVEL_API_USERNAME o VITE_TRAVEL_API_PASSWORD non definite.",
      );
    }

    const response = await axios.post(
      tokenEndpoint,
      new URLSearchParams({
        username: API_USERNAME,
        password: API_PASSWORD,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    // Salva il token e imposta la scadenza (assumiamo che duri 1 ora, 3600 secondi * 1000 ms/s)
    accessToken = response.data.access_token;
    // Imposta la scadenza basandosi su expires_in se disponibile, altrimenti default a 1 ora
    const expiresIn = response.data.expires_in || 60 * 60; // seconds
    tokenExpiryTime = Date.now() + expiresIn * 1000; // milliseconds
    console.log(
      "Token ottenuto con successo. Scadenza:",
      new Date(tokenExpiryTime).toISOString(),
    );

    return accessToken;
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
    throw new Error("Impossibile ottenere il token di autenticazione");
  }
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
      food_wine: {
        visite_alle_cantine: false,
        soggiorni_nella_wine_country: false,
        corsi_di_cucina: false,
      },
      vacanze_attive: {
        trekking_di_più_giorni: false,
        tour_in_e_bike_di_più_giorni: false,
        tour_in_bicicletta_di_più_giorni: false,
        sci_snowboard_di_più_giorni: false,
      },
      vita_locale: false,
      salute_e_benessere: false,
    };

    // Attiva le categorie selezionate
    formData.passioni?.forEach((interesse) => {
      // Gestisci i casi speciali per i sottotipi
      if (interesse === "musei" || interesse === "monumenti") {
        interessi.storia_e_arte.musei_e_gallerie = interesse === "musei";
        interessi.storia_e_arte.monumenti_e_architettura =
          interesse === "monumenti";
      } else if (interesse === "enogastronomia") {
        interessi.food_wine.visite_alle_cantine = true;
      } else if (interesse === "sport") {
        interessi.vacanze_attive.sci_snowboard_di_più_giorni = true;
      } else if (interesse === "cultura") {
        interessi.vita_locale = true;
      } else if (interesse === "benessere") {
        interessi.salute_e_benessere = true;
      }
    });

    return interessi;
  };

  return {
    interessi: mapInterests(),
    luoghi_da_non_perdere: {
      luoghi_specifici: formData.luoghiDaNonPerdere === "si",
      city:
        formData.luoghiSpecifici && formData.luoghiSpecifici.length > 0
          ? formData.luoghiSpecifici[0]
          : "",
    },
    mete_clou: {
      destinazioni_popolari: formData.tipoDestinazioni === "popolari",
      destinazioni_avventura: formData.tipoDestinazioni === "avventura",
      entrambe: formData.tipoDestinazioni === "entrambi",
    },
    ritmo_ideale: {
      veloce: formData.ritmoViaggio === "veloce",
      moderato: formData.ritmoViaggio === "moderato",
      rilassato: formData.ritmoViaggio === "rilassato",
    },
    sistemazione: {
      livello: {
        fascia_media: formData.livelloSistemazione === "standard",
        boutique: formData.livelloSistemazione === "boutique",
        eleganti: formData.livelloSistemazione === "lusso",
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
      single: false,
      azienda: formData.tipologiaViaggiatore === "business",
    },
    date: {
      check_in_time:
        formData.checkInDate instanceof Date
          ? formData.checkInDate.toISOString().split("T")[0]
          : "",
      check_out_time:
        formData.checkOutDate instanceof Date
          ? formData.checkOutDate.toISOString().split("T")[0]
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
      nessun_budget: formData.budget === "illimitato",
    },
    esigenze_particolari: formData.noteAggiuntive || null,
  };
};

export const submitPreferences = async (preferenceData: FormValues) => {
  try {
    // Ottieni un token valido prima della richiesta
    const token = await getAccessToken();

    // Trasforma i dati nel formato richiesto dall'API secondo lo swagger
    const searchData = mapFormToSearchInput(preferenceData);

    const searchEndpoint = `${API_URL}/api/search`;
    console.log("Invio richiesta all'endpoint di ricerca:", searchEndpoint);
    console.log("Dati inviati:", searchData);

    // Utilizza l'endpoint /search come specificato nello Swagger con il token di autenticazione
    // e il body in formato JSON
    const response = await axios.post(searchEndpoint, searchData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Risposta ricevuta dall'endpoint /search:", response.data);

    // Salva anche il record delle preferenze nel sistema locale (opzionale e separato dalla chiamata API esterna)
    try {
      await axios.post(`/api/preferences`, preferenceData);
      console.log("Preferenze salvate localmente con successo.");
    } catch (prefError) {
      console.warn(
        "Errore nel salvataggio delle preferenze locali:",
        prefError,
      );
      // Continuiamo comunque perché l'operazione principale è la ricerca
    }

    // Log di debug per monitorare la risposta dell'API
    console.log(`Risposta ricevuta dall'API (${API_URL}): `, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    // La risposta dell'endpoint /api/search contiene un job_id (SearchResponse schema)
    // Potrebbe essere necessario implementare la logica per il polling dello stato del job
    // utilizzando gli endpoint /api/search/{job_id} e /api/search/{job_id}/result
    // per ottenere il risultato finale, a seconda di come funziona l'API asincrona.
    // Per ora, restituiamo semplicemente la risposta iniziale che contiene il job_id.
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
          data: error.config?.data ? JSON.parse(error.config.data) : undefined, // Log request body if available
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
