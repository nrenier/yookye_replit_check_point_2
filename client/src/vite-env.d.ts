
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly TRAVEL_API_URL: string;
  readonly TRAVEL_API_USERNAME: string;
  readonly TRAVEL_API_PASSWORD: string;
  // altre variabili d'ambiente...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
