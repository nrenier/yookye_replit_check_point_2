import {
  users, type User, type InsertUser,
  preferences, type Preference, type InsertPreference,
  travelPackages, type TravelPackage, type InsertTravelPackage,
  bookings, type Booking, type InsertBooking
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

import { opensearchClient } from './db';
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStoreSession = createMemoryStore(session);

// Constants for OpenSearch indices
const INDEX_USERS = 'users';
const INDEX_PREFERENCES = 'preferences';
const INDEX_TRAVEL_PACKAGES = 'travel_packages';
const INDEX_BOOKINGS = 'bookings';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  
  // Preference operations
  getPreference(id: string): Promise<Preference | undefined>;
  getPreferencesByUserId(userId: string): Promise<Preference[]>;
  createPreference(preference: Omit<Preference, 'id'>): Promise<Preference>;
  updatePreference(id: string, preference: Partial<Omit<Preference, 'id'>>): Promise<Preference>;
  
  // TravelPackage operations
  getTravelPackage(id: string): Promise<TravelPackage | undefined>;
  getTravelPackages(): Promise<TravelPackage[]>;
  getTravelPackagesByCategory(category: string): Promise<TravelPackage[]>;
  createTravelPackage(travelPackage: Omit<TravelPackage, 'id'>): Promise<TravelPackage>;
  
  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUserId(userId: string): Promise<Booking[]>;
  createBooking(booking: Omit<Booking, 'id'>): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking>;
  updateBookingPaymentStatus(id: string, paymentStatus: string): Promise<Booking>;
  
  // Session store
  sessionStore: any; // Use 'any' to avoid the type error with session.Store
}

// Generate a random ID for new documents
const generateId = () => Math.random().toString(36).substring(2, 15);

// OpenSearchStorage 
export class OpenSearchStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize indices if they don't exist
    this.initializeIndices();
  }

  private async initializeIndices() {
    try {
      // Create indices if they don't exist
      const indices = [INDEX_USERS, INDEX_PREFERENCES, INDEX_TRAVEL_PACKAGES, INDEX_BOOKINGS];
      for (const index of indices) {
        const indexExists = await this.checkIndexExists(index);
        if (!indexExists) {
          await opensearchClient.put(`/${index}`, {
            mappings: {
              properties: {
                id: { type: 'keyword' }
              }
            }
          });
          console.log(`Created index: ${index}`);
        }
      }
      
      // Seed travel packages data after indices are created
      this.seedTravelPackages();
    } catch (error) {
      console.error("Failed to initialize OpenSearch indices:", error);
    }
  }

  private async checkIndexExists(index: string): Promise<boolean> {
    try {
      await opensearchClient.get(`/${index}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const response = await opensearchClient.get(`/${INDEX_USERS}/_doc/${id}`);
      if (response.status === 200 && response.data._source) {
        return response.data._source as User;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const response = await opensearchClient.post(`/${INDEX_USERS}/_search`, {
        query: {
          match: { username: username }
        }
      });
      
      const hits = response.data.hits.hits;
      if (hits.length > 0) {
        return hits[0]._source as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const response = await opensearchClient.post(`/${INDEX_USERS}/_search`, {
        query: {
          match: { email: email }
        }
      });
      
      const hits = response.data.hits.hits;
      if (hits.length > 0) {
        return hits[0]._source as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const id = generateId();
    const newUser = { id, ...user };
    
    try {
      await opensearchClient.put(`/${INDEX_USERS}/_doc/${id}`, newUser);
      return newUser as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }
  
  async getPreference(id: string): Promise<Preference | undefined> {
    try {
      const response = await opensearchClient.get(`/${INDEX_PREFERENCES}/_doc/${id}`);
      if (response.status === 200 && response.data._source) {
        return response.data._source as Preference;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
  
  async getPreferencesByUserId(userId: string): Promise<Preference[]> {
    try {
      const response = await opensearchClient.post(`/${INDEX_PREFERENCES}/_search`, {
        query: {
          match: { userId: userId }
        }
      });
      
      return response.data.hits.hits.map((hit: any) => hit._source as Preference);
    } catch (error) {
      console.error("Error fetching preferences by userId:", error);
      return [];
    }
  }
  
  async createPreference(preference: Omit<Preference, 'id'>): Promise<Preference> {
    const id = generateId();
    const newPreference = { id, ...preference };
    
    try {
      await opensearchClient.put(`/${INDEX_PREFERENCES}/_doc/${id}`, newPreference);
      return newPreference as Preference;
    } catch (error) {
      console.error("Error creating preference:", error);
      throw new Error("Failed to create preference");
    }
  }
  
  async updatePreference(id: string, updatedPreference: Partial<Omit<Preference, 'id'>>): Promise<Preference> {
    try {
      // First get the current preference
      const currentPreference = await this.getPreference(id);
      if (!currentPreference) {
        throw new Error(`Preference with id ${id} not found`);
      }
      
      // Merge the current and updated preferences
      const mergedPreference = { ...currentPreference, ...updatedPreference };
      
      // Update the preference in OpenSearch
      await opensearchClient.put(`/${INDEX_PREFERENCES}/_doc/${id}`, mergedPreference);
      
      return mergedPreference;
    } catch (error) {
      console.error("Error updating preference:", error);
      throw new Error(`Failed to update preference: ${error}`);
    }
  }
  
  async getTravelPackage(id: string): Promise<TravelPackage | undefined> {
    try {
      const response = await opensearchClient.get(`/${INDEX_TRAVEL_PACKAGES}/_doc/${id}`);
      if (response.status === 200 && response.data._source) {
        return response.data._source as TravelPackage;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
  
  async getTravelPackages(): Promise<TravelPackage[]> {
    try {
      const response = await opensearchClient.post(`/${INDEX_TRAVEL_PACKAGES}/_search`, {
        query: {
          match_all: {}
        },
        size: 100 // Adjust size as needed
      });
      
      return response.data.hits.hits.map((hit: any) => hit._source as TravelPackage);
    } catch (error) {
      console.error("Error fetching travel packages:", error);
      return [];
    }
  }
  
  async getTravelPackagesByCategory(category: string): Promise<TravelPackage[]> {
    try {
      const response = await opensearchClient.post(`/${INDEX_TRAVEL_PACKAGES}/_search`, {
        query: {
          match: { categories: category }
        }
      });
      
      return response.data.hits.hits.map((hit: any) => hit._source as TravelPackage);
    } catch (error) {
      console.error("Error fetching travel packages by category:", error);
      return [];
    }
  }
  
  async createTravelPackage(travelPackage: Omit<TravelPackage, 'id'>): Promise<TravelPackage> {
    const id = generateId();
    const newTravelPackage = { id, ...travelPackage };
    
    try {
      await opensearchClient.put(`/${INDEX_TRAVEL_PACKAGES}/_doc/${id}`, newTravelPackage);
      return newTravelPackage as TravelPackage;
    } catch (error) {
      console.error("Error creating travel package:", error);
      throw new Error("Failed to create travel package");
    }
  }
  
  async getBooking(id: string): Promise<Booking | undefined> {
    try {
      const response = await opensearchClient.get(`/${INDEX_BOOKINGS}/_doc/${id}`);
      if (response.status === 200 && response.data._source) {
        return response.data._source as Booking;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
  
  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    try {
      const response = await opensearchClient.post(`/${INDEX_BOOKINGS}/_search`, {
        query: {
          match: { userId: userId }
        },
        // Rimuoviamo il sort che può causare errori se bookingDate non è definito correttamente
        size: 100
      });
      
      // Ordina i risultati lato applicazione
      const bookings = response.data.hits.hits.map((hit: any) => hit._source as Booking);
      return bookings.sort((a, b) => {
        const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
        const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
        return dateB - dateA; // Ordine decrescente
      });
    } catch (error) {
      console.error("Error fetching bookings by userId:", error);
      return [];
    }
  }
  
  async createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const id = generateId();
    // Aggiungiamo la data di prenotazione se non è presente
    const bookingDate = booking.bookingDate || new Date().toISOString();
    const newBooking = { 
      id, 
      ...booking,
      bookingDate 
    };
    
    try {
      await opensearchClient.put(`/${INDEX_BOOKINGS}/_doc/${id}`, newBooking);
      return newBooking as Booking;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw new Error("Failed to create booking");
    }
  }
  
  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    try {
      // First get the current booking
      const currentBooking = await this.getBooking(id);
      if (!currentBooking) {
        throw new Error(`Booking with id ${id} not found`);
      }
      
      // Update the status
      const updatedBooking = { ...currentBooking, status };
      
      // Update the booking in OpenSearch
      await opensearchClient.put(`/${INDEX_BOOKINGS}/_doc/${id}`, updatedBooking);
      
      return updatedBooking;
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw new Error(`Failed to update booking status: ${error}`);
    }
  }
  
  async updateBookingPaymentStatus(id: string, paymentStatus: string): Promise<Booking> {
    try {
      // First get the current booking
      const currentBooking = await this.getBooking(id);
      if (!currentBooking) {
        throw new Error(`Booking with id ${id} not found`);
      }
      
      // Update the payment status
      const updatedBooking = { ...currentBooking, paymentStatus };
      
      // Update the booking in OpenSearch
      await opensearchClient.put(`/${INDEX_BOOKINGS}/_doc/${id}`, updatedBooking);
      
      return updatedBooking;
    } catch (error) {
      console.error("Error updating booking payment status:", error);
      throw new Error(`Failed to update booking payment status: ${error}`);
    }
  }
  
  private async seedTravelPackages() {
    try {
      // Check if travel packages already exist
      // Usiamo un approccio più robusto per gestire i potenziali errori
      let packagesExist = false;
      
      try {
        const response = await opensearchClient.post(`/${INDEX_TRAVEL_PACKAGES}/_search`, {
          query: {
            match_all: {}
          },
          size: 1
        });
        
        if (response.data.hits.total.value > 0) {
          console.log("Travel packages already seeded");
          packagesExist = true;
        }
      } catch (checkError) {
        console.warn("Error checking for existing packages:", checkError);
        // Non usciamo, continuiamo con il seeding
      }
      
      if (packagesExist) {
        return; // Already seeded
      }
      
      console.log("Iniziando il caricamento dei pacchetti di viaggio...");
      
      const packages = [
        {
          title: "Weekend Culturale a Roma",
          description: "Un weekend alla scoperta della città eterna",
          destination: "Roma",
          imageUrl: "https://images.unsplash.com/photo-1499678329028-101435549a4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
          rating: "4.5",
          reviewCount: 120,
          accommodationName: "Hotel Artemide 4★",
          accommodationType: "Hotel",
          transportType: "Volo A/R da Milano",
          durationDays: 3,
          durationNights: 2,
          experiences: [
            "Visita guidata ai Musei Vaticani",
            "Tour gastronomico di Trastevere",
            "Biglietti salta-fila per il Colosseo"
          ],
          price: 650,
          isRecommended: true,
          categories: ["Storia e Arte", "Enogastronomia", "Vita Locale"]
        },
        {
          title: "Relax e Cultura in Toscana",
          description: "Un soggiorno rilassante immersi nella campagna toscana",
          destination: "Toscana",
          imageUrl: "https://images.unsplash.com/photo-1534445867742-43195f401b6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
          rating: "4.0",
          reviewCount: 98,
          accommodationName: "Agriturismo Il Poggio",
          accommodationType: "Agriturismo",
          transportType: "Auto a noleggio",
          durationDays: 5,
          durationNights: 4,
          experiences: [
            "Degustazione vini a Montalcino",
            "Visita guidata di Siena",
            "Corso di cucina toscana"
          ],
          price: 780,
          isRecommended: false,
          categories: ["Enogastronomia", "Salute e Benessere", "Vita Locale"]
        },
        {
          title: "Mare e Cultura in Costiera",
          description: "Un viaggio alla scoperta della costiera amalfitana",
          destination: "Costiera Amalfitana",
          imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
          rating: "4.8",
          reviewCount: 156,
          accommodationName: "Hotel Belvedere 4★",
          accommodationType: "Hotel",
          transportType: "Treno A/R da Roma",
          durationDays: 6,
          durationNights: 5,
          experiences: [
            "Tour in barca di Capri",
            "Visita agli scavi di Pompei",
            "Lezione di cucina napoletana"
          ],
          price: 950,
          isRecommended: false,
          categories: ["Storia e Arte", "Enogastronomia", "Vita Locale"]
        },
        {
          title: "Avventura nelle Dolomiti",
          description: "Un'esperienza indimenticabile immersi nella natura",
          destination: "Dolomiti",
          imageUrl: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
          rating: "4.7",
          reviewCount: 89,
          accommodationName: "Mountain Lodge",
          accommodationType: "Rifugio",
          transportType: "Auto propria",
          durationDays: 4,
          durationNights: 3,
          experiences: [
            "Escursione guidata sul Monte Cristallo",
            "Mountain bike nei sentieri alpini",
            "Corso base di arrampicata"
          ],
          price: 580,
          isRecommended: false,
          categories: ["Sport", "Salute e Benessere"]
        },
        {
          title: "Benessere in Umbria",
          description: "Relax e natura nel cuore verde d'Italia",
          destination: "Umbria",
          imageUrl: "https://images.unsplash.com/photo-1531816458010-fb7685eecbcb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
          rating: "4.6",
          reviewCount: 102,
          accommodationName: "Borgo Spa Resort",
          accommodationType: "Resort",
          transportType: "Auto a noleggio",
          durationDays: 5,
          durationNights: 4,
          experiences: [
            "Percorso benessere con massaggio",
            "Yoga all'alba tra gli ulivi",
            "Escursione nei borghi medievali"
          ],
          price: 870,
          isRecommended: true,
          categories: ["Salute e Benessere", "Vita Locale"]
        },
        {
          title: "Food Tour in Emilia Romagna",
          description: "Un percorso gastronomico nella patria del gusto italiano",
          destination: "Emilia Romagna",
          imageUrl: "https://images.unsplash.com/photo-1528795259021-d8c86e14354c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
          rating: "4.9",
          reviewCount: 135,
          accommodationName: "Palazzo del Gusto",
          accommodationType: "B&B",
          transportType: "Treno A/R da Milano",
          durationDays: 4,
          durationNights: 3,
          experiences: [
            "Visita a un caseificio di Parmigiano Reggiano",
            "Corso di pasta fresca fatta in casa",
            "Tour con degustazione in acetaia tradizionale"
          ],
          price: 720,
          isRecommended: true,
          categories: ["Enogastronomia", "Vita Locale"]
        }
      ];
      
      console.log("Seeding travel packages...");
      // Implementiamo un retry per ogni pacchetto
      for (const pkg of packages) {
        try {
          await this.createTravelPackage(pkg);
          console.log(`Package "${pkg.title}" successfully seeded`);
        } catch (pkgError) {
          // Riproviamo una seconda volta in caso di errore
          console.warn(`Error seeding package "${pkg.title}", retrying...`, pkgError);
          try {
            // Piccola pausa prima di riprovare
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.createTravelPackage(pkg);
            console.log(`Package "${pkg.title}" successfully seeded on second attempt`);
          } catch (retryError) {
            console.error(`Failed to seed package "${pkg.title}" after retry:`, retryError);
          }
        }
      }
      
      // Verifichiamo il successo del seeding
      try {
        const verifyResponse = await opensearchClient.post(`/${INDEX_TRAVEL_PACKAGES}/_search`, {
          query: { match_all: {} },
          size: 1
        });
        
        if (verifyResponse.data.hits.total.value > 0) {
          console.log(`Successfully seeded travel packages. Total: ${verifyResponse.data.hits.total.value}`);
        } else {
          console.warn("No travel packages found after seeding attempt.");
        }
      } catch (verifyError) {
        console.error("Error verifying travel packages seeding:", verifyError);
      }
    } catch (error) {
      console.error("Error during travel packages seeding process:", error);
    }
  }
}

// Export an instance of OpenSearchStorage for use in the application
export const storage = new OpenSearchStorage();
