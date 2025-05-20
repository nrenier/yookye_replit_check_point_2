import { z } from "zod";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const NewPackageSchema = z.object({
  id_pacchetto: z.string(),
  master: z.object({
    citta_coinvolte: z.array(z.string()),
    temi_viaggio: z.array(z.string()),
    durata_complessiva_soggiorni_giorni: z.number(),
    numero_hotel: z.number(),
    numero_esperienze: z.number()
  }),
  detail: z.object({
    hotels: z.array(z.object({
      citta: z.string(),
      nome: z.string(),
      checkin: z.string(),
      checkout: z.string(),
      prezzo_giornaliero: z.number(),
      pasto_incluso: z.string(),
      tipo_camera: z.string(),
      stelle: z.number(),
      indirizzo: z.string(),
      telefono: z.string(),
      email: z.string(),
      descrizione: z.string(),
      latitudine: z.number(),
      longitudine: z.number(),
      hid_originale: z.number(),
      id_originale_hotel: z.string()
    })),
    esperienze: z.array(z.object({
      citta: z.string(),
      nome: z.string(),
      url: z.string(),
      descrizione: z.string(),
      tags: z.array(z.string()),
      tipologia: z.string(),
      dettagli_specifici: z.record(z.any()),
      dati_extra: z.string().nullable(),
      stato: z.string(),
      provincia: z.string()
    }))
  })
});

export type NewPackageResponse = z.infer<typeof NewPackageSchema>;

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

// Add missing schema for user registration
export const insertUserSchema = z.object({
  username: z.string().min(3, { message: "Username deve contenere almeno 3 caratteri" }),
  password: z.string().min(8, { message: "Password deve contenere almeno 8 caratteri" }),
  name: z.string().min(1, { message: "Il nome è obbligatorio" }),
  email: z.string().email({ message: "Email non valida" }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = UserProfile;