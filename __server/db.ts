import axios from "axios";

// OpenSearch configuration
const OPENSEARCH_HOST = process.env.OPENSEARCH_HOST || 'localhost';
const OPENSEARCH_PORT = process.env.OPENSEARCH_PORT || '9200';
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME || '';
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || '';
const OPENSEARCH_USE_SSL = (process.env.OPENSEARCH_USE_SSL || 'false').toLowerCase() === 'true';
const OPENSEARCH_URL = process.env.OPENSEARCH_URL || `http://${OPENSEARCH_HOST}:${OPENSEARCH_PORT}`;


// Create an axios instance for OpenSearch
const protocol = OPENSEARCH_USE_SSL ? 'https' : 'http';
//const baseURL = `${protocol}://${OPENSEARCH_HOST}:${OPENSEARCH_PORT}`;
const baseURL = OPENSEARCH_URL;

const auth = OPENSEARCH_USERNAME && OPENSEARCH_PASSWORD 
  ? { username: OPENSEARCH_USERNAME, password: OPENSEARCH_PASSWORD }
  : undefined;

export const opensearchClient = axios.create({
  baseURL,
  auth,
  timeout: 10000, // Aggiungiamo un timeout più lungo per dare tempo alle operazioni
  maxRedirects: 5
});

// Aggiungiamo migliori meccanismi di log
opensearchClient.interceptors.request.use(
  config => {
    console.log(`OpenSearch Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('OpenSearch Request Error:', error);
    return Promise.reject(error);
  }
);

opensearchClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      console.error(`OpenSearch Error (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('OpenSearch Error: No response received', error.request);
    } else {
      console.error('OpenSearch Error:', error.message);
    }
    return Promise.reject(error);
  }
);

import dotenv from 'dotenv';

// Carica le variabili d'ambiente dal file .env
dotenv.config();

// Helper function to check if OpenSearch is available
export const checkOpenSearchConnection = async () => {
  try {
    const response = await opensearchClient.get('/');
    return response.status === 200;
  } catch (error) {
    console.error('Error connecting to OpenSearch:', error);
    // In development, tollerare errori di connessione per consentire lo sviluppo senza OpenSearch
    if (process.env.NODE_ENV === 'development') {
      console.warn('Running in development mode without OpenSearch connection');
      return true;
    }
    return false;
  }
};