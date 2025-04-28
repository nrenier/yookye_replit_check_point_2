from typing import List, Optional, Dict, Any, TypeVar, Generic, Type
import json
from datetime import datetime

from ..config.opensearch_client import get_opensearch_client
from ..utils.auth import generate_id
from ..models.models import (
    User, UserInDB, UserCreate,
    Preference, PreferenceCreate,
    TravelPackage, TravelPackageCreate,
    Booking, BookingCreate, BookingUpdate
)
from ..config.settings import (
    INDEX_USERS, INDEX_PREFERENCES, INDEX_TRAVEL_PACKAGES, INDEX_BOOKINGS
)

T = TypeVar('T')
CreateT = TypeVar('CreateT')

class BaseRepository(Generic[T, CreateT]):
    """Repository base per le operazioni CRUD."""
    def __init__(self, model_cls: Type[T], index_name: str):
        self.client = get_opensearch_client()
        self.model_cls = model_cls
        self.index_name = index_name
    
    def _to_dict(self, obj: Any) -> Dict[str, Any]:
        """Converte un oggetto in un dizionario."""
        if hasattr(obj, "dict"):
            return obj.dict(exclude_none=True)
        elif hasattr(obj, "model_dump"):
            return obj.model_dump(exclude_none=True)
        return dict(obj)
    
    async def get_by_id(self, id: str) -> Optional[T]:
        """Ottiene un elemento per ID."""
        try:
            response = self.client.get(index=self.index_name, id=id)
            if response["found"]:
                data = response["_source"]
                # Assicura che l'ID sia nel dato
                data["id"] = response["_id"]
                return self.model_cls(**data)
        except Exception:
            return None
        return None
    
    async def get_all(self) -> List[T]:
        """Ottiene tutti gli elementi."""
        response = self.client.search(
            index=self.index_name,
            body={"query": {"match_all": {}}},
            size=1000  # Limita i risultati a 1000 elementi
        )
        
        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["id"] = hit["_id"]
            results.append(self.model_cls(**data))
        
        return results
    
    async def create(self, obj_in: CreateT) -> T:
        """Crea un nuovo elemento."""
        obj_dict = self._to_dict(obj_in)
        
        # Genera un ID se non presente
        if "id" not in obj_dict or not obj_dict["id"]:
            obj_dict["id"] = generate_id()
        
        id = obj_dict.pop("id")  # Rimuovi l'ID dal dict per evitare duplicazione
        
        # Indice il documento
        response = self.client.index(
            index=self.index_name,
            id=id,
            body=obj_dict,
            refresh=True
        )
        
        # Ricrea l'oggetto modello con l'ID
        return await self.get_by_id(response["_id"])
    
    async def update(self, id: str, obj_in: Dict[str, Any]) -> Optional[T]:
        """Aggiorna un elemento."""
        try:
            # Verifica se l'elemento esiste
            exists = self.client.exists(index=self.index_name, id=id)
            if not exists:
                return None
            
            # Aggiorna il documento
            response = self.client.update(
                index=self.index_name,
                id=id,
                body={"doc": obj_in},
                refresh=True
            )
            
            # Restituisci l'elemento aggiornato
            return await self.get_by_id(id)
        except Exception:
            return None
    
    async def delete(self, id: str) -> bool:
        """Elimina un elemento."""
        try:
            response = self.client.delete(
                index=self.index_name,
                id=id,
                refresh=True
            )
            return response["result"] == "deleted"
        except Exception:
            return False
    
    async def search(self, query: Dict[str, Any], size: int = 100) -> List[T]:
        """Cerca elementi con un query OpenSearch."""
        response = self.client.search(
            index=self.index_name,
            body=query,
            size=size
        )
        
        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["id"] = hit["_id"]
            results.append(self.model_cls(**data))
        
        return results

class UserRepository(BaseRepository[User, UserCreate]):
    """Repository per gli utenti."""
    def __init__(self):
        super().__init__(User, INDEX_USERS)
    
    async def get_by_username(self, username: str) -> Optional[UserInDB]:
        """Ottiene un utente per username."""
        query = {
            "query": {
                "term": {
                    "username.keyword": username
                }
            }
        }
        
        response = self.client.search(
            index=self.index_name,
            body=query
        )
        
        hits = response["hits"]["hits"]
        if hits:
            data = hits[0]["_source"]
            data["id"] = hits[0]["_id"]
            return UserInDB(**data)
        
        return None
    
    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        """Ottiene un utente per email."""
        if not email:
            return None
        
        query = {
            "query": {
                "term": {
                    "email.keyword": email
                }
            }
        }
        
        response = self.client.search(
            index=self.index_name,
            body=query
        )
        
        hits = response["hits"]["hits"]
        if hits:
            data = hits[0]["_source"]
            data["id"] = hits[0]["_id"]
            return UserInDB(**data)
        
        return None
    
    async def create_user(self, user_create: UserCreate, hashed_password: str) -> User:
        """Crea un nuovo utente con password hashata."""
        user_dict = self._to_dict(user_create)
        user_dict["password"] = hashed_password
        
        # Genera un ID se non presente
        if "id" not in user_dict or not user_dict["id"]:
            user_dict["id"] = generate_id()
        
        id = user_dict.pop("id")  # Rimuovi l'ID dal dict
        
        # Indice il documento
        response = self.client.index(
            index=self.index_name,
            id=id,
            body=user_dict,
            refresh=True
        )
        
        # Restituisci l'utente senza la password
        created_user = await self.get_by_id(response["_id"])
        return created_user

class PreferenceRepository(BaseRepository[Preference, PreferenceCreate]):
    """Repository per le preferenze."""
    def __init__(self):
        super().__init__(Preference, INDEX_PREFERENCES)
    
    async def get_by_user_id(self, user_id: str) -> List[Preference]:
        """Ottiene le preferenze di un utente."""
        query = {
            "query": {
                "term": {
                    "userId.keyword": user_id
                }
            },
            "sort": [
                {"createdAt": {"order": "desc"}}
            ]
        }
        
        response = self.client.search(
            index=self.index_name,
            body=query,
            size=100
        )
        
        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["id"] = hit["_id"]
            results.append(Preference(**data))
        
        return results

class TravelPackageRepository(BaseRepository[TravelPackage, TravelPackageCreate]):
    """Repository per i pacchetti di viaggio."""
    def __init__(self):
        super().__init__(TravelPackage, INDEX_TRAVEL_PACKAGES)
    
    async def get_by_category(self, category: str) -> List[TravelPackage]:
        """Ottiene i pacchetti di viaggio per categoria."""
        query = {
            "query": {
                "match": {
                    "categories": category
                }
            }
        }
        
        return await self.search(query)
    
    async def get_recommended_packages(self, preferences: Preference) -> List[TravelPackage]:
        """Ottiene i pacchetti di viaggio raccomandati in base alle preferenze."""
        # Criterio di raccomandazione basato sugli interessi dell'utente
        if not preferences or not preferences.interests:
            # Se non ci sono preferenze, restituisci pacchetti consigliati generali
            query = {
                "query": {
                    "term": {
                        "isRecommended": True
                    }
                }
            }
        else:
            # Altrimenti, usa gli interessi dell'utente per consigliare pacchetti
            query = {
                "query": {
                    "bool": {
                        "should": [
                            {"terms": {"categories": preferences.interests}}
                        ],
                        "minimum_should_match": 1
                    }
                }
            }
        
        return await self.search(query, size=3)

class BookingRepository(BaseRepository[Booking, BookingCreate]):
    """Repository per le prenotazioni."""
    def __init__(self):
        super().__init__(Booking, INDEX_BOOKINGS)
    
    async def get_by_user_id(self, user_id: str) -> List[Booking]:
        """Ottiene le prenotazioni di un utente."""
        query = {
            "query": {
                "term": {
                    "userId.keyword": user_id
                }
            },
            "sort": [
                {"bookingDate": {"order": "desc"}}
            ]
        }
        
        return await self.search(query)
    
    async def update_status(self, id: str, status: str) -> Optional[Booking]:
        """Aggiorna lo stato di una prenotazione."""
        return await self.update(id, {"status": status})
    
    async def update_payment_status(self, id: str, payment_status: str) -> Optional[Booking]:
        """Aggiorna lo stato di pagamento di una prenotazione."""
        return await self.update(id, {"paymentStatus": payment_status})