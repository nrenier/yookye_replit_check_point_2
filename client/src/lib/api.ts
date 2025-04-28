import axios from 'axios';
import type { z } from 'zod'; // z is imported but not used in the provided snippet. Keeping it as is.
import { format } from 'date-fns';

// Definizione del tipo FormValues
export type FormValues = {
  passioni: string[];
  luoghiDaNonPerdere: string; // Assuming this is the destination city name
  luoghiSpecifici?: string; // Assuming a string describing specific places
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
  dettagliArrivoPartenza?: string; // Assuming details about arrival/departure points
  budget: string;
  serviziSpeciali?: string;
  email: string; // This field doesn't seem directly mapped to the API schema
};

// Usa l'URL del server REST esterno se disponibile, altrimenti fallback su /api
const API_URL = import.meta.env.VITE_TRAVEL_API_URL || '/api'; // External REST API URL from .env
const API_USERNAME = import.meta.env.VITE_TRAVEL_API_USERNAME;
const API_PASSWORD = import.meta.env.VITE_TRAVEL_API_PASSWORD;

console.log("URL API utilizzato:", API_URL);

// Token e timestamp di scadenza
let accessToken: string | null = null;
let tokenExpiryTime = 0;

// Funzione per ottenere un token valido
const getAccessToken = async (): Promise<string> => {
  // Se il token esiste ed è ancora valido (considerando 5 minuti di margine)
  if (accessToken && tokenExpiryTime > Date.now() + 300000) {
    console.log("Utilizzo token esistente, valido fino a:", new Date(tokenExpiryTime).toISOString());
    return accessToken;
  }

  // Altrimenti richiediamo un nuovo token
  try {
    const tokenEndpoint = `${API_URL}/api/auth/token`;
    console.log("Richiedo nuovo token di accesso all'endpoint:", tokenEndpoint);

    // Verifica che le variabili d'ambiente siano definite
    if (!API_USERNAME || !API_PASSWORD) {
      throw new Error("Variabili d'ambiente VITE_TRAVEL_API_USERNAME o VITE_TRAVEL_API_PASSWORD non definite.");
    }

    const response = await axios.post(tokenEndpoint,
      new URLSearchParams({
        username: API_USERNAME,
        password: API_PASSWORD
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Salva il token e imposta la scadenza (assumiamo che duri 1 ora, 3600 secondi * 1000 ms/s)
    accessToken = response.data.access_token;
    // Imposta la scadenza basandosi su expires_in se disponibile, altrimenti default a 1 ora
    const expiresIn = response.data.expires_in || (60 * 60); // seconds
    tokenExpiryTime = Date.now() + (expiresIn * 1000); // milliseconds
    console.log("Token ottenuto con successo. Scadenza:", new Date(tokenExpiryTime).toISOString());

    return accessToken;
  } catch (error) {
    console.error("Errore nell'ottenere il token:", error);
    // Log dettagliato dell'errore Axios se disponibile
    if (axios.isAxiosError(error)) {
      console.error('Dettagli errore token:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
           url: error.config?.url,
           method: error.config?.method,
           baseURL: error.config?.baseURL
        }
      });
    }
    throw new Error("Impossibile ottenere il token di autenticazione");
  }
};

// Mappa i dati del form al formato richiesto dall'API di ricerca (come definito nello Swagger)
const mapFormToSearchInput = (data: FormValues) => {

   // Logica per TRASPORTI basata sull'errore API ricevuto:
   // 'conosci_arrivo_e_partenza' deve essere True SOLO se 'description' è fornita.
   // Quindi, 'conosci_arrivo_e_partenza' è vero SE E SOLO SE 'dettagliArrivoPartenza' ha un valore.
   const conosciArrivoPartenza = !!data.dettagliArrivoPartenza;

   // Logica per BUDGET: L'errore indica che almeno una fascia deve essere True.
   // La mappatura attuale imposta una sola fascia a True basandosi su data.budget.
   // Se data.budget non corrisponde a nessun valore previsto, tutte saranno False, causando l'errore.
   // Assicurati che la validazione del form garantisca che data.budget sia sempre uno dei valori attesi.
   const isBudgetSelected = ['economico', 'medio', 'comfort', 'lusso', 'ultra_lusso'].includes(data.budget);
    if (!isBudgetSelected && data.budget) {
        console.warn(`Avviso: Il valore budget '${data.budget}' non corrisponde a una fascia attesa. Questo potrebbe causare un errore API.`);
    } else if (!isBudgetSelected && !data.budget) {
         console.warn("Avviso: Nessuna fascia di budget selezionata nel form (campo vuoto). Questo causerà un errore API.");
    }


  return {
    // TRASPORTI (REQUIRED by API schema)
    trasporti: {
      conosci_arrivo_e_partenza: conosciArrivoPartenza, // True solo se dettagliArrivoPartenza è fornito
      description: data.dettagliArrivoPartenza || null, // Mappa i dettagli, usa null se vuoto
      // auto_propria e Unknown non sono presenti in FormValues e sono opzionali, quindi vengono omessi.
    },
    // LUOGHI DA NON PERDERE (REQUIRED by API schema)
    luoghi_da_non_perdere: {
      city: data.localitaArrivoPartenza, // Utilizza localitaArrivoPartenza come nome della città di destinazione
      luoghi_specifici: !!data.luoghiSpecifici // Mappa il campo opzionale 'luoghiSpecifici' a un booleano
    },
    // VIAGGIATORI (REQUIRED by API schema)
    viaggiatori: {
      adults_number: Number(data.numAdulti),
      children_number: Number(data.numBambini || 0),
      baby_number: Number(data.numNeonati || 0)
    },
    // DATE (REQUIRED by API schema)
    date: {
      check_in_time: format(data.checkInDate, 'yyyy-MM-dd'),
      check_out_time: format(data.checkOutDate, 'yyyy-MM-dd')
    },
    // BUDGET PER PERSONA GIORNO (REQUIRED by API schema)
    budget_per_persona_giorno: {
      // Mappatura basata sul valore della stringa data.budget.
      // Richiede che data.budget sia una delle stringhe valide ('economico', 'medio', etc.)
      // e che almeno una sia vera per superare la validazione API.
      economico: data.budget === 'economy',
      fascia_media: data.budget === 'mid_range',
      comfort: data.budget === 'comfort',
      lusso: data.budget === 'lusso',
      ultra_lusso: data.budget === 'ultra_lusso'
    },
    // SISTEMAZIONE (REQUIRED by API schema)
    sistemazione: {
      livello: { // SISTEMAZIONE LIVELLO (REQUIRED by Sistemazione schema)
        fascia_media: data.livelloSistemazione === 'media',
        boutique: data.livelloSistemazione === 'boutique',
        eleganti: data.livelloSistemazione === 'elegante'
      },
      tipologia: { // SISTEMAZIONE TIPOLOGIA (REQUIRED by Sistemazione schema)
        hotel: data.tipologiaSistemazione.includes('hotel'),
        'b&b': data.tipologiaSistemazione.includes('bb'), // Usa la chiave esatta dello schema 'b&b'
        agriturismo: data.tipologiaSistemazione.includes('agriturismo'),
        villa: data.tipologiaSistemazione.includes('villa'),
        appartamento: data.tipologiaSistemazione.includes('appartamento'),
        glamping: data.tipologiaSistemazione.includes('glamping')
      }
    },
    // ESIGENZE PARTICOLARI (Optional in API schema)
    esigenze_particolari: data.serviziSpeciali || null, // Mappa il campo opzionale, usa null se vuoto
    // INTERESSI (Optional in API schema - OMMESSO per discrepanza con FormValues.passioni)
    // TIPOLOGIA VIAGGIATORE (Optional in API schema)
    tipologia_viaggiatore: {
      family: data.tipologiaViaggiatore === 'famiglia',
      amici: data.tipologiaViaggiatore === 'amici',
      coppia: data.tipologiaViaggiatore === 'coppia',
      single: data.tipologiaViaggiatore === 'single'
    },
    // RITMO IDEALE (Optional in API schema)
    ritmo_ideale: {
      veloce: data.ritmoViaggio === 'veloce',
      moderato: data.ritmoViaggio === 'moderato',
      rilassato: data.ritmoViaggio === 'rilassato'
    }
    // Nota: numCamere, tipoDestinazioni, passioni e email non sono presenti nello schema API AccommodationSearchInput e sono stati omessi.
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
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log("Risposta ricevuta dall'endpoint /search:", response.data);

    // Salva anche il record delle preferenze nel sistema locale (opzionale e separato dalla chiamata API esterna)
    try {
      await axios.post(`/api/preferences`, preferenceData);
      console.log("Preferenze salvate localmente con successo.");
    } catch (prefError) {
      console.warn("Errore nel salvataggio delle preferenze locali:", prefError);
      // Continuiamo comunque perché l'operazione principale è la ricerca
    }

    // La risposta dell'endpoint /api/search contiene un job_id (SearchResponse schema)
    // Potrebbe essere necessario implementare la logica per il polling dello stato del job
    // utilizzando gli endpoint /api/search/{job_id} e /api/search/{job_id}/result
    // per ottenere il risultato finale, a seconda di come funziona l'API asincrona.
    // Per ora, restituiamo semplicemente la risposta iniziale che contiene il job_id.
    return response.data;

  } catch (error) {
    console.error('Error submitting preferences:', error);

    // Log dettagliato dell'errore per il debugging
    if (axios.isAxiosError(error)) {
      console.error('Dettagli errore Axios:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data ? JSON.parse(error.config.data) : undefined // Log request body if available
        }
      });
       // Aggiungi un log specifico se l'errore corrisponde a quelli noti
       if (error.response?.data && typeof error.response.data === 'object') {
            const apiError = error.response.data as any;
            if (apiError.code === 'INVALID_JSON_FORMAT' && apiError.errors) {
                console.error("Errori di validazione API specifici:", apiError.errors);
            }
       }

    }

    throw error; // Rilancia l'errore per essere gestito dal chiamante
  }
};