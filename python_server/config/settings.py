import os
from dotenv import load_dotenv

# Carica variabili d'ambiente dal file .env
load_dotenv()

# Configurazioni del server
PORT = int(os.getenv("PORT", 5000))
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")

# Configurazioni di sicurezza
SECRET_KEY = os.getenv("SECRET_KEY", "chiave_segreta_di_default")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Configurazioni OpenSearch
OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "localhost")
OPENSEARCH_PORT = int(os.getenv("OPENSEARCH_PORT", 9200))
OPENSEARCH_USER = os.getenv("OPENSEARCH_USER", "admin")
OPENSEARCH_PASSWORD = os.getenv("OPENSEARCH_PASSWORD", "admin")
OPENSEARCH_USE_SSL = os.getenv("OPENSEARCH_USE_SSL", "false").lower() == "true"
OPENSEARCH_VERIFY_CERTS = os.getenv("OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"


# Configurazione JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "yookve_development_secret_key")
JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "60"))  # minuti

# Configurazione Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Configurazione External Travel API
TRAVEL_API_URL = os.getenv("TRAVEL_API_URL")
TRAVEL_API_USERNAME = os.getenv("TRAVEL_API_USERNAME")
TRAVEL_API_PASSWORD = os.getenv("TRAVEL_API_PASSWORD")

# Nomi degli indici OpenSearch
INDEX_USERS = "users"
INDEX_PREFERENCES = "preferences"
INDEX_TRAVEL_PACKAGES = "travel_packages"
INDEX_BOOKINGS = "bookings"
INDEX_SAVED_PACKAGES = "saved_packages"

# Mapping per gli indici
MAPPINGS = {
    INDEX_USERS: {
        "mappings": {
            "properties": {
                "username": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "name": {"type": "text"},
                "email": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "password": {"type": "keyword"}
            }
        }
    },
    INDEX_PREFERENCES: {
        "mappings": {
            "properties": {
                "userId": {"type": "keyword"},
                "destination": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "travelType": {"type": "keyword"},
                "interests": {"type": "keyword"},
                "budget": {"type": "integer"},
                "departureDate": {"type": "date", "format": "strict_date_optional_time||epoch_millis"},
                "returnDate": {"type": "date", "format": "strict_date_optional_time||epoch_millis"},
                "numAdults": {"type": "integer"},
                "numChildren": {"type": "integer"},
                "numInfants": {"type": "integer"},
                "accommodationType": {"type": "keyword"},
                "createdAt": {"type": "date", "format": "strict_date_optional_time||epoch_millis"}
            }
        }
    },
    INDEX_TRAVEL_PACKAGES: {
        "mappings": {
            "properties": {
                "title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "description": {"type": "text"},
                "destination": {"type": "text", "fields": {"keyword": {"type": {"type": "keyword"}}}},
                "imageUrl": {"type": "keyword"},
                "rating": {"type": "keyword"},
                "reviewCount": {"type": "integer"},
                "accommodationName": {"type": "text"},
                "accommodationType": {"type": "keyword"},
                "transportType": {"type": "keyword"},
                "durationDays": {"type": "integer"},
                "durationNights": {"type": "integer"},
                "experiences": {"type": "keyword"}, # Assuming experiences is array of strings in the frontend TravelPackage
                "price": {"type": "float"},
                "isRecommended": {"type": "boolean"},
                "categories": {"type": "keyword"}
            }
        }
    },
    INDEX_BOOKINGS: {
        "mappings": {
            "properties": {
                "userId": {"type": "keyword"},
                "packageId": {"type": "keyword"},
                "travelDate": {"type": "date", "format": "strict_date_optional_time||epoch_millis"},
                "returnDate": {"type": "date", "format": "strict_date_optional_time||epoch_millis"},
                "numAdults": {"type": "integer"},
                "numChildren": {"type": "integer"},
                "numInfants": {"type": "integer"},
                "totalPrice": {"type": "integer"},
                "specialRequests": {"type": "text"},
                "contactPhone": {"type": "keyword"},
                "contactEmail": {"type": "keyword"},
                "bookingDate": {"type": "date", "format": "strict_date_optional_time||epoch_millis"},
                "status": {"type": "keyword"},
                "paymentStatus": {"type": "keyword"}
            }
        }
    },
    INDEX_SAVED_PACKAGES: {
        "mappings": {
            "properties": {
                "userId": {"type": "keyword"},  # To associate with user
                "savedAt": {"type": "date", "format": "strict_date_optional_time||epoch_millis"},  # Timestamp
                # Copy relevant fields from INDEX_TRAVEL_PACKAGES mapping here
                "title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "description": {"type": "text"},
                "destination": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "imageUrl": {"type": "keyword"},
                "rating": {"type": "keyword"},
                "reviewCount": {"type": "integer"},
                "accommodationName": {"type": "text"},
                "accommodationType": {"type": "keyword"},
                "transportType": {"type": "keyword"},
                "durationDays": {"type": "integer"},
                "durationNights": {"type": "integer"},
                "experiences": {"type": "keyword"},  # Assuming experiences is array of strings in the frontend TravelPackage
                "price": {"type": "float"},
                "isRecommended": {"type": "boolean"},
                "categories": {"type": "keyword"}
            }
        }
    }
}