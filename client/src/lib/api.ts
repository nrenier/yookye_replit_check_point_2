import axios from 'axios';
import type { z } from 'zod';
import { format } from 'date-fns';

// Definizione del tipo FormValues
export type FormValues = {
  passioni: string[];
  luoghiDaNonPerdere: string;
  luoghiSpecifici?: string;
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
  dettagliArrivoPartenza?: string;
  budget: string;
  serviziSpeciali?: string;
  email: string;
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
    return accessToken;
  }

  // Altrimenti richiediamo un nuovo token
  try {
    const tokenEndpoint = `${API_URL}/api/auth/token`;
    console.log("Richiedo nuovo token di accesso all'endpoint:", tokenEndpoint);
    
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

    // Salva il token e imposta la scadenza (assumiamo che duri 1 ora)
    accessToken = response.data.access_token;
    // Imposta la scadenza a 1 ora dal momento attuale
    tokenExpiryTime = Date.now() + (60 * 60 * 1000);
    
    console.log("Token ottenuto con successo");
    return accessToken;
  } catch (error) {
    console.error("Errore nell'ottenere il token:", error);
    throw new Error("Impossibile ottenere il token di autenticazione");
  }
};

// Mappa i dati del form al formato richiesto dall'API di ricerca (come definito nello Swagger)
const mapFormToSearchInput = (data: FormValues) => {
  return {
    luoghi_da_non_perdere: {
      city: data.localitaArrivoPartenza,
      luoghi_specifici: !!data.luoghiSpecifici
    },
    viaggiatori: {
      adults_number: Number(data.numAdulti),
      children_number: String(data.numBambini),
      baby_number: String(data.numNeonati)
    },
    date: {
      check_in_time: format(data.checkInDate, 'yyyy-MM-dd'),
      check_out_time: format(data.checkOutDate, 'yyyy-MM-dd')
    },
    budget_per_persona_giorno: {
      economico: data.budget === 'economico',
      fascia_media: data.budget === 'medio',
      comfort: data.budget === 'comfort',
      lusso: data.budget === 'lusso',
      ultra_lusso: data.budget === 'ultra_lusso'
    },
    sistemazione: {
      livello: {
        fascia_media: data.livelloSistemazione === 'media',
        boutique: data.livelloSistemazione === 'boutique',
        eleganti: data.livelloSistemazione === 'elegante'
      },
      tipologia: {
        hotel: data.tipologiaSistemazione.includes('hotel'),
        'b&b': data.tipologiaSistemazione.includes('bb'),
        agriturismo: data.tipologiaSistemazione.includes('agriturismo'),
        villa: data.tipologiaSistemazione.includes('villa'),
        appartamento: data.tipologiaSistemazione.includes('appartamento'),
        glamping: data.tipologiaSistemazione.includes('glamping')
      }
    },
    esigenze_particolari: data.serviziSpeciali,
    tipologia_viaggiatore: {
      family: data.tipologiaViaggiatore === 'famiglia',
      amici: data.tipologiaViaggiatore === 'amici',
      coppia: data.tipologiaViaggiatore === 'coppia',
      single: data.tipologiaViaggiatore === 'single'
    },
    ritmo_ideale: {
      veloce: data.ritmoViaggio === 'veloce',
      moderato: data.ritmoViaggio === 'moderato',
      rilassato: data.ritmoViaggio === 'rilassato'
    }
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
    const response = await axios.post(searchEndpoint, searchData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("Risposta ricevuta dall'endpoint /search:", response.data);
    
    // Salva anche il record delle preferenze nel sistema locale
    try {
      await axios.post(`/api/preferences`, preferenceData);
    } catch (prefError) {
      console.warn("Errore nel salvataggio delle preferenze locali:", prefError);
      // Continuiamo comunque perché l'operazione principale è la ricerca
    }
    
    return response.data;
  } catch (error) {
    console.error('Error submitting preferences:', error);
    
    // Log dettagliato dell'errore per il debugging
    if (axios.isAxiosError(error)) {
      console.error('Dettagli errore:', {
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
    
    throw error;
  }
};
