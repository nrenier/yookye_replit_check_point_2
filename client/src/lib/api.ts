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

const API_URL = '/api'; // Your backend API base URL

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
    // Trasforma i dati nel formato richiesto dall'API secondo lo swagger
    const searchData = mapFormToSearchInput(preferenceData);
    
    // Utilizza l'endpoint /search come specificato nello Swagger
    const response = await axios.post(`${API_URL}/search`, searchData);
    
    // Salva anche il record delle preferenze nel sistema
    await axios.post(`${API_URL}/preferences`, preferenceData);
    
    return response.data;
  } catch (error) {
    console.error('Error submitting preferences:', error);
    throw error;
  }
};
