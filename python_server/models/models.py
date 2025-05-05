from datetime import datetime
from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# Classe di base per tutti i modelli
class YookveBaseModel(BaseModel):
    """Classe base per tutti i modelli dell'app."""
    id: Optional[str] = None

    class Config:
        populate_by_name = True
        # Allow extra fields for flexibility when creating models from dicts
        # Be cautious with this, validate carefully in repositories/endpoints
        extra = 'allow' 

# Modelli per gli utenti
class UserBase(YookveBaseModel):
    """Informazioni di base per l'utente."""
    username: str
    name: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    """Dati necessari per creare un nuovo utente."""
    password: str

class UserLogin(BaseModel):
    """Dati necessari per il login."""
    username: str
    password: str

class User(UserBase):
    """Modello completo dell'utente (senza la password)."""
    pass

class UserInDB(User):
    """Modello dell'utente nel database."""
    password: str  # Password hash

# Modelli per le preferenze di viaggio
class PreferenceBase(YookveBaseModel):
    """Informazioni di base per le preferenze di viaggio."""
    userId: str
    destination: Optional[str] = None
    travelType: Optional[str] = None
    interests: Optional[List[str]] = None
    budget: Optional[int] = None
    departureDate: Optional[str] = None
    returnDate: Optional[str] = None
    numAdults: Optional[int] = 1
    numChildren: Optional[int] = 0
    numInfants: Optional[int] = 0
    accommodationType: Optional[str] = None

class PreferenceCreate(PreferenceBase):
    """Dati necessari per creare nuove preferenze."""
    pass

class Preference(PreferenceBase):
    """Modello completo delle preferenze."""
    createdAt: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat())

# Modelli per i pacchetti di viaggio
class TravelPackageBase(YookveBaseModel):
    """Classe base per i pacchetti di viaggio."""
    title: str
    description: str
    destination: str
    imageUrl: str = ""
    rating: Optional[str] = None
    reviewCount: int = 0
    accommodationName: str = ""
    accommodationType: Optional[str] = None
    transportType: Optional[str] = None
    durationDays: int = 0
    durationNights: int = 0
    experiences: Optional[List[str]] = None
    price: float = 0
    isRecommended: bool = False
    categories: Optional[List[str]] = None

class TravelPackageCreate(TravelPackageBase):
    """Dati necessari per creare un nuovo pacchetto di viaggio."""
    pass

class TravelPackage(TravelPackageBase):
    """Modello completo del pacchetto di viaggio."""
    pass

# Modello per i pacchetti salvati (NEW)
class SavedPackage(TravelPackageBase):
    """Modello per un pacchetto salvato dall'utente."""
    userId: str = Field(...) # ID dell'utente che ha salvato il pacchetto, required
    savedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat()) # Timestamp di salvataggio UTC
    user_id: Optional[str] = None # Added to handle the user_id case

    def model_post_init(self, __context):
        # Se user_id è presente ma userId no, usare user_id per userId
        if not self.userId and self.user_id:
            self.userId = self.user_id


# Modelli per le prenotazioni
class BookingBase(YookveBaseModel):
    """Informazioni di base per una prenotazione."""
    userId: str
    packageId: str # This might need to be a string depending on your package ID type
    travelDate: str
    returnDate: str
    numAdults: int = 1
    numChildren: int = 0
    numInfants: int = 0
    totalPrice: int
    specialRequests: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[EmailStr] = None # Use EmailStr for email validation

class BookingCreate(BookingBase):
    """Dati necessari per creare una nuova prenotazione."""
    pass

class BookingUpdate(YookveBaseModel):
    """Dati per aggiornare una prenotazione."""
    status: Optional[str] = None
    paymentStatus: Optional[str] = None

class Booking(BookingBase):
    """Modello completo della prenotazione."""
    bookingDate: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: str = "pending"  # pending, confirmed, cancelled
    paymentStatus: str = "unpaid"  # unpaid, paid

# Modelli per i pagamenti
class PaymentIntent(BaseModel):
    """Modello per creare un intento di pagamento."""
    bookingId: str

class PaymentIntentResponse(BaseModel):
    """Risposta per un intento di pagamento."""
    clientSecret: str

# Modelli per le risposte API
class ApiResponse(BaseModel):
    """Modello base per le risposte API."""
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None

# Modelli per l'autenticazione
class Token(BaseModel):
    """Token di accesso."""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Dati contenuti nel token."""
    username: Optional[str] = None
    user_id: Optional[str] = None