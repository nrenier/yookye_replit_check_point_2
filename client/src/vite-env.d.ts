
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRAVEL_API_URL: string;
  readonly VITE_TRAVEL_API_USERNAME: string;
  readonly VITE_TRAVEL_API_PASSWORD: string;
  // altre variabili d'ambiente...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
