
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRAVEL_API_URL: string;
  // altre variabili d'ambiente...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
