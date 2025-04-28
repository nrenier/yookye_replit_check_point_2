import axios from 'axios';
import type { z } from 'zod';

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

export const submitPreferences = async (preferenceData: FormValues) => {
  try {
    const response = await axios.post(`${API_URL}/preferences`, preferenceData);
    return response.data;
  } catch (error) {
    console.error('Error submitting preferences:', error);
    throw error;
  }
};
