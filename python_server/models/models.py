from datetime import datetime
from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# Classe di base per tutti i modelli
class YookveBaseModel(BaseModel):
    """Classe base per tutti i modelli dell'app."""
    id: Optional[str] = None
    
    class Config:
        populate_by_name = True

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
    """Informazioni di base per i pacchetti di viaggio."""
    title: str
    description: str
    destination: str
    imageUrl: Optional[str] = None
    rating: Optional[str] = None
    reviewCount: Optional[int] = 0
    accommodationName: Optional[str] = None
    accommodationType: Optional[str] = None
    transportType: Optional[str] = None
    durationDays: Optional[int] = None
    durationNights: Optional[int] = None
    experiences: Optional[Union[List[str], str]] = None  # Può essere una lista o un testo
    price: Optional[int] = None
    isRecommended: Optional[bool] = False
    categories: Optional[List[str]] = None

class TravelPackageCreate(TravelPackageBase):
    """Dati necessari per creare un nuovo pacchetto di viaggio."""
    pass

class TravelPackage(TravelPackageBase):
    """Modello completo del pacchetto di viaggio."""
    pass

# Modelli per le prenotazioni
class BookingBase(YookveBaseModel):
    """Informazioni di base per una prenotazione."""
    userId: str
    packageId: str
    travelDate: str
    returnDate: str
    numAdults: int = 1
    numChildren: int = 0
    numInfants: int = 0
    totalPrice: int
    specialRequests: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None

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