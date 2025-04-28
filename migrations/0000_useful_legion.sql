CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"booking_date" timestamp DEFAULT now() NOT NULL,
	"travel_date" date NOT NULL,
	"return_date" date NOT NULL,
	"num_adults" integer DEFAULT 1,
	"num_children" integer DEFAULT 0,
	"num_infants" integer DEFAULT 0,
	"total_price" integer NOT NULL,
	"special_requests" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"contact_phone" text,
	"contact_email" text
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"destination" text,
	"specific_city" text,
	"departure_date" text,
	"return_date" text,
	"adults" integer DEFAULT 1,
	"children" integer DEFAULT 0,
	"infants" integer DEFAULT 0,
	"interests" text[],
	"accommodation_type" text,
	"star_rating" text,
	"transport_type" text,
	"departure_city" text,
	"budget" text
);
--> statement-breakpoint
CREATE TABLE "travel_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"destination" text NOT NULL,
	"image_url" text,
	"rating" text,
	"review_count" integer,
	"accommodation_name" text,
	"accommodation_type" text,
	"transport_type" text,
	"duration_days" integer,
	"duration_nights" integer,
	"experiences" text[],
	"price" integer,
	"is_recommended" boolean DEFAULT false,
	"categories" text[]
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_travel_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."travel_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;