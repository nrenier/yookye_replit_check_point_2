import os
from dotenv import load_dotenv

# Carica le variabili d'ambiente
load_dotenv()

# Configurazione OpenSearch
OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "localhost")
OPENSEARCH_PORT = int(os.getenv("OPENSEARCH_PORT", "9200"))
OPENSEARCH_USERNAME = os.getenv("OPENSEARCH_USERNAME", "")
OPENSEARCH_PASSWORD = os.getenv("OPENSEARCH_PASSWORD", "")
OPENSEARCH_USE_SSL = os.getenv("OPENSEARCH_USE_SSL", "false").lower() == "true"
OPENSEARCH_VERIFY_CERTS = os.getenv("OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"

# Configurazione JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "yookve_development_secret_key")
JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "60"))  # minuti

# Configurazione Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Configurazione server
PORT = int(os.getenv("PORT", "5000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "yookve_flask_secret_key")

# Nomi degli indici OpenSearch
INDEX_USERS = "users"
INDEX_PREFERENCES = "preferences"
INDEX_TRAVEL_PACKAGES = "travel_packages"
INDEX_BOOKINGS = "bookings"

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
                "destination": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "imageUrl": {"type": "keyword"},
                "rating": {"type": "keyword"},
                "reviewCount": {"type": "integer"},
                "accommodationName": {"type": "text"},
                "accommodationType": {"type": "keyword"},
                "transportType": {"type": "keyword"},
                "durationDays": {"type": "integer"},
                "durationNights": {"type": "integer"},
                "experiences": {"type": "text"},
                "price": {"type": "integer"},
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
    }
}