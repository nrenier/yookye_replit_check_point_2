swagger_config = {
    "swagger": "2.0",
    "info": {
        "title": "Yookve API",
        "description": "API per il servizio di prenotazione viaggi personalizzati Yookve",
        "version": "1.0.0"
    },
    "basePath": "/api",
    "schemes": ["http", "https"],
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT token di autorizzazione. Esempio: \"Bearer {token}\""
        }
    },
    "tags": [
        {"name": "auth", "description": "Operazioni di autenticazione"},
        {"name": "travel-packages", "description": "Operazioni sui pacchetti di viaggio"},
        {"name": "preferences", "description": "Operazioni sulle preferenze dell'utente"},
        {"name": "bookings", "description": "Operazioni sulle prenotazioni"},
        {"name": "recommendations", "description": "Operazioni sulle raccomandazioni"}
    ],
    "paths": {
        "/auth/register": {
            "post": {
                "tags": ["auth"],
                "summary": "Registra un nuovo utente",
                "parameters": [{
                    "in": "body",
                    "name": "user",
                    "description": "Dati utente da registrare",
                    "schema": {
                        "$ref": "#/definitions/UserCreate"
                    }
                }],
                "responses": {
                    "201": {
                        "description": "Utente registrato con successo",
                        "schema": {
                            "$ref": "#/definitions/AuthResponse"
                        }
                    },
                    "400": {
                        "description": "Errore di validazione"
                    }
                }
            }
        },
        "/auth/login": {
            "post": {
                "tags": ["auth"],
                "summary": "Effettua il login",
                "parameters": [{
                    "in": "body",
                    "name": "credentials",
                    "description": "Credenziali di accesso",
                    "schema": {
                        "$ref": "#/definitions/UserLogin"
                    }
                }],
                "responses": {
                    "200": {
                        "description": "Login effettuato con successo",
                        "schema": {
                            "$ref": "#/definitions/AuthResponse"
                        }
                    },
                    "401": {
                        "description": "Credenziali non valide"
                    }
                }
            }
        },
        "/auth/logout": {
            "post": {
                "tags": ["auth"],
                "summary": "Effettua il logout",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {
                        "description": "Logout effettuato con successo"
                    }
                }
            }
        },
        "/auth/user": {
            "get": {
                "tags": ["auth"],
                "summary": "Ottiene l'utente corrente",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {
                        "description": "Dati dell'utente",
                        "schema": {
                            "$ref": "#/definitions/User"
                        }
                    },
                    "401": {
                        "description": "Non autenticato"
                    }
                }
            }
        },
        "/travel-packages": {
            "get": {
                "tags": ["travel-packages"],
                "summary": "Ottiene tutti i pacchetti di viaggio",
                "responses": {
                    "200": {
                        "description": "Lista dei pacchetti di viaggio",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/TravelPackage"
                            }
                        }
                    }
                }
            }
        },
        "/travel-packages/{id}": {
            "get": {
                "tags": ["travel-packages"],
                "summary": "Ottiene un pacchetto di viaggio per ID",
                "parameters": [{
                    "in": "path",
                    "name": "id",
                    "required": true,
                    "type": "string",
                    "description": "ID del pacchetto di viaggio"
                }],
                "responses": {
                    "200": {
                        "description": "Pacchetto di viaggio",
                        "schema": {
                            "$ref": "#/definitions/TravelPackage"
                        }
                    },
                    "404": {
                        "description": "Pacchetto non trovato"
                    }
                }
            }
        },
        "/travel-packages/category/{category}": {
            "get": {
                "tags": ["travel-packages"],
                "summary": "Ottiene i pacchetti di viaggio per categoria",
                "parameters": [{
                    "in": "path",
                    "name": "category",
                    "required": true,
                    "type": "string",
                    "description": "Nome della categoria"
                }],
                "responses": {
                    "200": {
                        "description": "Lista dei pacchetti di viaggio nella categoria",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/TravelPackage"
                            }
                        }
                    }
                }
            }
        },
        "/preferences": {
            "get": {
                "tags": ["preferences"],
                "summary": "Ottiene le preferenze dell'utente corrente",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {
                        "description": "Lista delle preferenze",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/Preference"
                            }
                        }
                    },
                    "401": {
                        "description": "Non autenticato"
                    }
                }
            },
            "post": {
                "tags": ["preferences"],
                "summary": "Crea una nuova preferenza",
                "security": [{"Bearer": []}],
                "parameters": [{
                    "in": "body",
                    "name": "preference",
                    "description": "Dati della preferenza da creare",
                    "schema": {
                        "$ref": "#/definitions/PreferenceCreate"
                    }
                }],
                "responses": {
                    "201": {
                        "description": "Preferenza creata con successo",
                        "schema": {
                            "$ref": "#/definitions/Preference"
                        }
                    },
                    "400": {
                        "description": "Errore di validazione"
                    },
                    "401": {
                        "description": "Non autenticato"
                    }
                }
            }
        },
        "/recommendations": {
            "get": {
                "tags": ["recommendations"],
                "summary": "Ottiene i pacchetti di viaggio raccomandati",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {
                        "description": "Lista dei pacchetti di viaggio raccomandati",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/TravelPackage"
                            }
                        }
                    },
                    "401": {
                        "description": "Non autenticato"
                    },
                    "404": {
                        "description": "Nessuna preferenza trovata"
                    }
                }
            }
        },
        "/bookings": {
            "get": {
                "tags": ["bookings"],
                "summary": "Ottiene le prenotazioni dell'utente corrente",
                "security": [{"Bearer": []}],
                "responses": {
                    "200": {
                        "description": "Lista delle prenotazioni",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/Booking"
                            }
                        }
                    },
                    "401": {
                        "description": "Non autenticato"
                    }
                }
            },
            "post": {
                "tags": ["bookings"],
                "summary": "Crea una nuova prenotazione",
                "security": [{"Bearer": []}],
                "parameters": [{
                    "in": "body",
                    "name": "booking",
                    "description": "Dati della prenotazione da creare",
                    "schema": {
                        "$ref": "#/definitions/BookingCreate"
                    }
                }],
                "responses": {
                    "201": {
                        "description": "Prenotazione creata con successo",
                        "schema": {
                            "$ref": "#/definitions/Booking"
                        }
                    },
                    "400": {
                        "description": "Errore di validazione"
                    },
                    "401": {
                        "description": "Non autenticato"
                    }
                }
            }
        },
        "/bookings/{id}": {
            "get": {
                "tags": ["bookings"],
                "summary": "Ottiene una prenotazione per ID",
                "security": [{"Bearer": []}],
                "parameters": [{
                    "in": "path",
                    "name": "id",
                    "required": true,
                    "type": "string",
                    "description": "ID della prenotazione"
                }],
                "responses": {
                    "200": {
                        "description": "Prenotazione",
                        "schema": {
                            "$ref": "#/definitions/Booking"
                        }
                    },
                    "401": {
                        "description": "Non autenticato"
                    },
                    "404": {
                        "description": "Prenotazione non trovata"
                    }
                }
            }
        },
        "/bookings/{id}/status": {
            "patch": {
                "tags": ["bookings"],
                "summary": "Aggiorna lo stato di una prenotazione",
                "security": [{"Bearer": []}],
                "parameters": [
                    {
                        "in": "path",
                        "name": "id",
                        "required": true,
                        "type": "string",
                        "description": "ID della prenotazione"
                    },
                    {
                        "in": "body",
                        "name": "status",
                        "description": "Nuovo stato della prenotazione",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "status": {
                                    "type": "string",
                                    "enum": ["pending", "confirmed", "cancelled"]
                                }
                            }
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Prenotazione aggiornata con successo",
                        "schema": {
                            "$ref": "#/definitions/Booking"
                        }
                    },
                    "400": {
                        "description": "Stato non valido"
                    },
                    "401": {
                        "description": "Non autenticato"
                    },
                    "404": {
                        "description": "Prenotazione non trovata"
                    }
                }
            }
        },
        "/bookings/create-payment-intent": {
            "post": {
                "tags": ["bookings"],
                "summary": "Crea un intento di pagamento per Stripe",
                "security": [{"Bearer": []}],
                "parameters": [{
                    "in": "body",
                    "name": "paymentIntent",
                    "description": "ID della prenotazione da pagare",
                    "schema": {
                        "$ref": "#/definitions/PaymentIntent"
                    }
                }],
                "responses": {
                    "200": {
                        "description": "Intento di pagamento creato con successo",
                        "schema": {
                            "$ref": "#/definitions/PaymentIntentResponse"
                        }
                    },
                    "400": {
                        "description": "Errore di validazione"
                    },
                    "401": {
                        "description": "Non autenticato"
                    },
                    "404": {
                        "description": "Prenotazione non trovata"
                    },
                    "503": {
                        "description": "Servizio di pagamento non disponibile"
                    }
                }
            }
        }
    },
    "definitions": {
        "UserBase": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string"}
            },
            "required": ["username"]
        },
        "UserCreate": {
            "allOf": [
                {"$ref": "#/definitions/UserBase"},
                {
                    "type": "object",
                    "properties": {
                        "password": {"type": "string"}
                    },
                    "required": ["password"]
                }
            ]
        },
        "UserLogin": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "password": {"type": "string"}
            },
            "required": ["username", "password"]
        },
        "User": {
            "allOf": [
                {"$ref": "#/definitions/UserBase"},
                {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"}
                    }
                }
            ]
        },
        "Token": {
            "type": "object",
            "properties": {
                "access_token": {"type": "string"},
                "token_type": {"type": "string"}
            },
            "required": ["access_token", "token_type"]
        },
        "AuthResponse": {
            "type": "object",
            "properties": {
                "user": {"$ref": "#/definitions/User"},
                "access_token": {"type": "string"},
                "token_type": {"type": "string"}
            }
        },
        "PreferenceBase": {
            "type": "object",
            "properties": {
                "destination": {"type": "string"},
                "travelType": {"type": "string"},
                "interests": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "budget": {"type": "integer"},
                "departureDate": {"type": "string", "format": "date-time"},
                "returnDate": {"type": "string", "format": "date-time"},
                "numAdults": {"type": "integer"},
                "numChildren": {"type": "integer"},
                "numInfants": {"type": "integer"},
                "accommodationType": {"type": "string"}
            }
        },
        "PreferenceCreate": {
            "allOf": [
                {"$ref": "#/definitions/PreferenceBase"}
            ]
        },
        "Preference": {
            "allOf": [
                {"$ref": "#/definitions/PreferenceBase"},
                {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "userId": {"type": "string"},
                        "createdAt": {"type": "string", "format": "date-time"}
                    }
                }
            ]
        },
        "TravelPackage": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "destination": {"type": "string"},
                "imageUrl": {"type": "string"},
                "rating": {"type": "string"},
                "reviewCount": {"type": "integer"},
                "accommodationName": {"type": "string"},
                "accommodationType": {"type": "string"},
                "transportType": {"type": "string"},
                "durationDays": {"type": "integer"},
                "durationNights": {"type": "integer"},
                "experiences": {"type": "string"},
                "price": {"type": "integer"},
                "isRecommended": {"type": "boolean"},
                "categories": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["title", "description", "destination"]
        },
        "BookingBase": {
            "type": "object",
            "properties": {
                "packageId": {"type": "string"},
                "travelDate": {"type": "string", "format": "date-time"},
                "returnDate": {"type": "string", "format": "date-time"},
                "numAdults": {"type": "integer"},
                "numChildren": {"type": "integer"},
                "numInfants": {"type": "integer"},
                "totalPrice": {"type": "integer"},
                "specialRequests": {"type": "string"},
                "contactPhone": {"type": "string"},
                "contactEmail": {"type": "string"}
            },
            "required": ["packageId", "travelDate", "returnDate", "totalPrice"]
        },
        "BookingCreate": {
            "allOf": [
                {"$ref": "#/definitions/BookingBase"}
            ]
        },
        "Booking": {
            "allOf": [
                {"$ref": "#/definitions/BookingBase"},
                {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "userId": {"type": "string"},
                        "bookingDate": {"type": "string", "format": "date-time"},
                        "status": {"type": "string", "enum": ["pending", "confirmed", "cancelled"]},
                        "paymentStatus": {"type": "string", "enum": ["unpaid", "paid"]}
                    }
                }
            ]
        },
        "PaymentIntent": {
            "type": "object",
            "properties": {
                "bookingId": {"type": "string"}
            },
            "required": ["bookingId"]
        },
        "PaymentIntentResponse": {
            "type": "object",
            "properties": {
                "clientSecret": {"type": "string"}
            },
            "required": ["clientSecret"]
        }
    }
}