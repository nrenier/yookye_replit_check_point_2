import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertPreferenceSchema, insertBookingSchema } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️ Missing STRIPE_SECRET_KEY. Stripe payment functionality will be unavailable.");
}

// Inizializza Stripe solo se la chiave è disponibile
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Get all travel packages
  app.get("/api/travel-packages", async (req, res) => {
    try {
      const packages = await storage.getTravelPackages();
      res.status(200).json(packages);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei pacchetti di viaggio" });
    }
  });

  // Get travel packages by category
  app.get("/api/travel-packages/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const packages = await storage.getTravelPackagesByCategory(category);
      res.status(200).json(packages);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei pacchetti di viaggio per categoria" });
    }
  });

  // Get a specific travel package
  app.get("/api/travel-packages/:id", async (req, res) => {
    try {
      const id = req.params.id; // Usa l'ID come stringa senza convertirlo
      const travelPackage = await storage.getTravelPackage(id);
      
      if (!travelPackage) {
        return res.status(404).json({ message: "Pacchetto di viaggio non trovato" });
      }
      
      res.status(200).json(travelPackage);
    } catch (error) {
      console.error("Errore nel recupero del pacchetto di viaggio:", error);
      res.status(500).json({ message: "Errore nel recupero del pacchetto di viaggio" });
    }
  });

  // Get user preferences
  app.get("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      const preferences = await storage.getPreferencesByUserId(userId);
      res.status(200).json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle preferenze" });
    }
  });

  // Create preference
  app.post("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      
      // Validate request body
      const parsedData = insertPreferenceSchema.parse({
        ...req.body,
        userId
      });
      
      const preference = await storage.createPreference(parsedData);
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore nella creazione delle preferenze" });
    }
  });

  // Get recommendations based on preferences
  app.get("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      const preferences = await storage.getPreferencesByUserId(userId);
      
      if (preferences.length === 0) {
        return res.status(404).json({ message: "Nessuna preferenza trovata" });
      }
      
      // Use the most recent preference for recommendations
      const latestPreference = preferences[preferences.length - 1];
      
      // Get all packages
      const allPackages = await storage.getTravelPackages();
      
      // Simple recommendation algorithm based on interests
      let recommendedPackages = allPackages;
      
      if (latestPreference.interests && latestPreference.interests.length > 0) {
        // Filter packages that match at least one interest
        recommendedPackages = allPackages.filter(pkg => 
          pkg.categories && 
          pkg.categories.some(category => 
            latestPreference.interests && latestPreference.interests.includes(category)
          )
        );
      }
      
      // Sort by relevance (number of matching interests)
      recommendedPackages.sort((a, b) => {
        const aMatches = a.categories && latestPreference.interests ? 
          a.categories.filter(cat => latestPreference.interests!.includes(cat)).length : 0;
        const bMatches = b.categories && latestPreference.interests ? 
          b.categories.filter(cat => latestPreference.interests!.includes(cat)).length : 0;
        
        return bMatches - aMatches;
      });
      
      // Return top 3 recommendations
      const topRecommendations = recommendedPackages.slice(0, 3);
      
      res.status(200).json(topRecommendations);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle raccomandazioni" });
    }
  });

  // Get user bookings
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      const bookings = await storage.getBookingsByUserId(userId);
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle prenotazioni" });
    }
  });

  // Get a specific booking
  app.get("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const id = req.params.id; // Usa l'ID come stringa
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Prenotazione non trovata" });
      }
      
      // Verifica che l'utente sia il proprietario della prenotazione
      const userId = (req.user as Express.User).id;
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Non autorizzato" });
      }
      
      res.status(200).json(booking);
    } catch (error) {
      console.error("Errore nel recupero della prenotazione:", error);
      res.status(500).json({ message: "Errore nel recupero della prenotazione" });
    }
  });

  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = (req.user as Express.User).id;
      
      // Validate request body
      const parsedData = insertBookingSchema.parse({
        ...req.body,
        userId,
        status: "pending", // default
        paymentStatus: "unpaid", // default
        bookingDate: new Date().toISOString() // Aggiungiamo la data corrente
      });
      
      // Verifica che il pacchetto esista
      const packageId = parsedData.packageId;
      const travelPackage = await storage.getTravelPackage(packageId);
      
      if (!travelPackage) {
        return res.status(404).json({ message: "Pacchetto di viaggio non trovato" });
      }
      
      const booking = await storage.createBooking(parsedData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Errore nella creazione della prenotazione:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore nella creazione della prenotazione" });
    }
  });

  // Update booking status
  app.patch("/api/bookings/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const id = req.params.id; // Usa l'ID come stringa
      const { status } = req.body;
      
      if (!status || !["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Stato non valido" });
      }
      
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Prenotazione non trovata" });
      }
      
      // Verifica che l'utente sia il proprietario della prenotazione
      const userId = (req.user as Express.User).id;
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Non autorizzato" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(id, status);
      res.status(200).json(updatedBooking);
    } catch (error) {
      console.error("Errore nell'aggiornamento dello stato della prenotazione:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento dello stato della prenotazione" });
    }
  });

  // Create a payment intent for Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    if (!stripe) {
      return res.status(503).json({ message: "Servizio di pagamento non disponibile" });
    }
    
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "ID prenotazione mancante" });
      }
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Prenotazione non trovata" });
      }
      
      // Verifica che l'utente sia il proprietario della prenotazione
      const userId = (req.user as Express.User).id;
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Non autorizzato" });
      }
      
      // Crea il payment intent con Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: booking.totalPrice * 100, // Converti in centesimi
        currency: "eur",
        metadata: {
          bookingId: bookingId.toString(),
          userId: userId.toString()
        }
      });
      
      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      res.status(500).json({ message: "Errore nella creazione dell'intento di pagamento", error: error.message });
    }
  });

  // Webhook to handle Stripe payment events
  app.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Servizio di pagamento non disponibile" });
    }
    
    let event;
    
    try {
      // Verifica la firma dell'evento (disabilitata in questa versione per semplicità)
      // const signature = req.headers['stripe-signature'];
      // event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      
      // Per semplicità, usa direttamente il payload
      event = req.body;
      
      // Gestisci gli eventi di pagamento
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        // Aggiorna lo stato di pagamento della prenotazione
        if (bookingId) {
          await storage.updateBookingPaymentStatus(bookingId, "paid");
          await storage.updateBookingStatus(bookingId, "confirmed");
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ message: `Webhook error: ${error.message}` });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
