// Shared type definitions

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface NewPackageResponse {
  id_pacchetto: string;
  titolo: string;
  descrizione: string;
  master: {
    citta_coinvolte: string[];
    temi_viaggio: string[];
    prezzo_totale: number;
  };
  detail: {
    cover_image?: string;
    hotels?: {
      nome: string;
      stelle: number;
      prezzo_giornaliero: number;
      id_hotel: string;
    }[];
    tours?: {
      nome: string;
      durata: string;
      prezzo: number;
      id_tour: string;
    }[];
  };
}

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    user_id: string;
    name: string;
    roles: string[];
  };
  message?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface PackageDataResponse {
  success: boolean;
  data: any[];
  message?: string;
}