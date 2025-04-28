import { pgTable, text, serial, integer, boolean, jsonb, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), 
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const preferences = pgTable("preferences", {
  id: text("id").primaryKey(), 
  userId: text("user_id").notNull(), 
  destination: text("destination"),
  specificCity: text("specific_city"),
  departureDate: text("departure_date"),
  returnDate: text("return_date"),
  adults: integer("adults").default(1),
  children: integer("children").default(0),
  infants: integer("infants").default(0),
  interests: text("interests").array(),
  accommodationType: text("accommodation_type"),
  starRating: text("star_rating"),
  transportType: text("transport_type"),
  departureCity: text("departure_city"),
  budget: text("budget"),
});

export const insertPreferenceSchema = createInsertSchema(preferences).omit({
  id: true,
});

export const travelPackages = pgTable("travel_packages", {
  id: text("id").primaryKey(), 
  title: text("title").notNull(),
  description: text("description"),
  destination: text("destination").notNull(),
  imageUrl: text("image_url"),
  rating: text("rating"),
  reviewCount: integer("review_count"),
  accommodationName: text("accommodation_name"),
  accommodationType: text("accommodation_type"),
  transportType: text("transport_type"),
  durationDays: integer("duration_days"),
  durationNights: integer("duration_nights"),
  experiences: text("experiences").array(),
  price: integer("price"),
  isRecommended: boolean("is_recommended").default(false),
  categories: text("categories").array(),
});

export const insertTravelPackageSchema = createInsertSchema(travelPackages).omit({
  id: true,
});

// Nuova tabella per le prenotazioni
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(), 
  userId: text("user_id").notNull(), 
  packageId: text("package_id").notNull(), 
  bookingDate: timestamp("booking_date").defaultNow().notNull(),
  travelDate: date("travel_date").notNull(),
  returnDate: date("return_date").notNull(),
  numAdults: integer("num_adults").default(1),
  numChildren: integer("num_children").default(0),
  numInfants: integer("num_infants").default(0),
  totalPrice: integer("total_price").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").default("pending").notNull(), 
  paymentStatus: text("payment_status").default("unpaid").notNull(), 
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingDate: true,
}).extend({
  travelDate: z.string().min(1, "Data di partenza richiesta"),
  returnDate: z.string().min(1, "Data di ritorno richiesta"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Preference = typeof preferences.$inferSelect;
export type InsertPreference = z.infer<typeof insertPreferenceSchema>;
export type TravelPackage = typeof travelPackages.$inferSelect;
export type InsertTravelPackage = z.infer<typeof insertTravelPackageSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;