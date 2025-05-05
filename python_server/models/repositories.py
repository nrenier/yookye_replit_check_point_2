from typing import List, Optional, Dict, Any, TypeVar, Generic, Type
import json
from datetime import datetime

from ..config.opensearch_client import get_opensearch_client
from ..utils.auth import generate_id
from ..models.models import (
    User, UserInDB, UserCreate,
    Preference, PreferenceCreate,
    TravelPackage, TravelPackageCreate,
    Booking, BookingCreate, BookingUpdate,
    SavedPackage # Import SavedPackage model
)
from ..config.settings import (
    INDEX_USERS, INDEX_PREFERENCES, INDEX_TRAVEL_PACKAGES, INDEX_BOOKINGS,
    INDEX_SAVED_PACKAGES # Import index name
)
from opensearchpy.exceptions import NotFoundError
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')
CreateT = TypeVar('CreateT')

class BaseRepository(Generic[T, CreateT]):
    """Repository base per le operazioni CRUD."""
    def __init__(self, model_cls: Type[T], index_name: str):
        self.client = get_opensearch_client()
        self.model_cls = model_cls
        self.index_name = index_name
        self._ensure_index_exists()

    def _ensure_index_exists(self):
        """Ensures the OpenSearch index exists."""
        # This is a basic check, you might need more complex logic for mappings
        if not self.client.indices.exists(index=self.index_name):
            try:
                logger.info(f"Index '{self.index_name}' not found. Creating index...")
                # You might want to add specific mappings here if needed
                self.client.indices.create(index=self.index_name)
                logger.info(f"Index '{self.index_name}' created successfully.")
            except Exception as e:
                logger.error(f"Failed to create index '{self.index_name}': {e}", exc_info=True)
                # Decide how to handle this error, maybe raise it
                # raise

    def _to_dict(self, obj: Any) -> Dict[str, Any]:
        """Converts a Pydantic model or object to a dictionary."""
        if hasattr(obj, "model_dump"):
            return obj.model_dump(exclude_none=True)
        elif hasattr(obj, "dict"):
            return obj.dict(exclude_none=True)
        return dict(obj)

    def get_by_id(self, id: str) -> Optional[T]:
        """Ottiene un elemento per ID."""
        if not id:
            logger.warning(f"Attempted to get document with empty ID from index '{self.index_name}'.")
            return None

        try:
            response = self.client.get(index=self.index_name, id=id)
            if response["found"]:
                data = response["_source"]
                data["id"] = response["_id"]
                return self.model_cls(**data)
            else:
                # This case might not be reached if get throws NotFoundError
                logger.info(f"Document with ID '{id}' not found in index '{self.index_name}'.")
                return None
        except NotFoundError:
            logger.info(f"Document with ID '{id}' not found in index '{self.index_name}'.")
            return None
        except Exception as e:
            logger.error(f"Error fetching document ID '{id}' from index '{self.index_name}': {e}", exc_info=True)
            return None

    def get_all(self, size: int = 1000) -> List[T]:
        """Ottiene tutti gli elementi."""
        try:
            response = self.client.search(
                index=self.index_name,
                body={"query": {"match_all": {}}},
                size=size
            )

            results = []
            for hit in response["hits"]["hits"]:
                data = hit["_source"]
                data["id"] = hit["_id"]
                try:
                    results.append(self.model_cls(**data))
                except Exception as e:
                    logger.error(f"Error parsing document {hit['_id']} from index '{self.index_name}': {e}. Data: {data}", exc_info=True)
                    # Optionally skip problematic documents
                    # continue
            return results
        except Exception as e:
            logger.error(f"Error fetching all documents from index '{self.index_name}': {e}", exc_info=True)
            return []

    def create(self, obj_in: CreateT) -> T:
        """Crea un nuovo elemento."""
        obj_dict = self._to_dict(obj_in)

        # Ensure ID is generated and handled correctly
        doc_id = obj_dict.pop("id", None) or generate_id()
        obj_dict["id"] = doc_id # Add the final ID back to the dict for consistency if needed by model

        try:
            response = self.client.index(
                index=self.index_name,
                id=doc_id,
                body=obj_dict,
                refresh="wait_for" # Use wait_for for better consistency
            )
            logger.info(f"Document created/updated with ID '{response['_id']}' in index '{self.index_name}'. Result: {response['result']}")

            # Retrieve the created/updated document to return the full model
            created_obj = self.get_by_id(doc_id)
            if created_obj:
                return created_obj
            else:
                # This should ideally not happen if refresh='wait_for' is used
                logger.error(f"Failed to retrieve document immediately after creation/update. ID: {doc_id}, Index: {self.index_name}")
                # Fallback: Try to return based on input + generated ID
                obj_dict['id'] = doc_id # Ensure ID is present
                return self.model_cls(**obj_dict)
        except Exception as e:
            logger.error(f"Error creating document in index '{self.index_name}': {e}. Data: {obj_dict}", exc_info=True)
            raise # Re-raise the exception to be handled by the caller

    def update(self, id: str, obj_in: Dict[str, Any]) -> Optional[T]:
        """Aggiorna un elemento."""
        if not id:
            logger.warning(f"Attempted to update document with empty ID in index '{self.index_name}'.")
            return None

        try:
            # Update the document
            response = self.client.update(
                index=self.index_name,
                id=id,
                body={"doc": obj_in},
                refresh="wait_for"
            )
            logger.info(f"Document updated with ID '{response['_id']}' in index '{self.index_name}'. Result: {response['result']}")

            # Retrieve and return the updated document
            return self.get_by_id(id)
        except NotFoundError:
            logger.warning(f"Attempted to update non-existent document ID '{id}' in index '{self.index_name}'.")
            return None
        except Exception as e:
            logger.error(f"Error updating document ID '{id}' in index '{self.index_name}': {e}. Update data: {obj_in}", exc_info=True)
            return None

    def delete(self, id: str) -> bool:
        """Elimina un elemento."""
        if not id:
             logger.warning(f"Attempted to delete document with empty ID from index '{self.index_name}'.")
             return False
        try:
            response = self.client.delete(
                index=self.index_name,
                id=id,
                refresh="wait_for"
            )
            deleted = response.get("result") == "deleted"
            if deleted:
                logger.info(f"Document deleted with ID '{id}' from index '{self.index_name}'.")
            else:
                logger.warning(f"Delete operation for ID '{id}' in index '{self.index_name}' did not return 'deleted'. Response: {response}")
            return deleted
        except NotFoundError:
            logger.warning(f"Attempted to delete non-existent document ID '{id}' from index '{self.index_name}'.")
            return False # Document didn't exist, so not 'deleted' in this call
        except Exception as e:
            logger.error(f"Error deleting document ID '{id}' from index '{self.index_name}': {e}", exc_info=True)
            return False

    def search(self, query: Dict[str, Any], size: int = 100) -> List[T]:
        """Cerca elementi con un query OpenSearch."""
        try:
            response = self.client.search(
                index=self.index_name,
                body=query,
                size=size
            )

            results = []
            for hit in response["hits"]["hits"]:
                data = hit["_source"]
                data["id"] = hit["_id"]
                try:
                    results.append(self.model_cls(**data))
                except Exception as e:
                    logger.error(f"Error parsing document {hit['_id']} from index '{self.index_name}': {e}. Data: {data}", exc_info=True)
                    # Optionally skip problematic documents
                    # continue
            return results
        except Exception as e:
            logger.error(f"Error searching index '{self.index_name}': {e}. Query: {query}", exc_info=True)
            return []


class UserRepository(BaseRepository[User, UserCreate]):
    """Repository per gli utenti."""
    def __init__(self):
        super().__init__(User, INDEX_USERS)

    def get_by_username(self, username: str) -> Optional[UserInDB]:
        """Ottiene un utente per username."""
        if not username:
            return None

        query = {
            "query": {
                "term": {
                    "username.keyword": username
                }
            }
        }
        results = self.search(query, size=1)
        if results:
             # We need UserInDB which includes password hash
             user_data = self.get_by_id(results[0].id)
             if user_data:
                 # Re-fetch including potentially excluded fields like password
                  try:
                      response = self.client.get(index=self.index_name, id=results[0].id)
                      if response["found"]:
                           db_data = response["_source"]
                           db_data["id"] = response["_id"]
                           return UserInDB(**db_data)
                  except Exception as e:
                      logger.error(f"Error re-fetching user {results[0].id} for UserInDB: {e}")
        return None

    def get_by_email(self, email: str) -> Optional[UserInDB]:
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
        results = self.search(query, size=1)
        if results:
            # Re-fetch like in get_by_username to get UserInDB
            try:
                response = self.client.get(index=self.index_name, id=results[0].id)
                if response["found"]:
                    db_data = response["_source"]
                    db_data["id"] = response["_id"]
                    return UserInDB(**db_data)
            except Exception as e:
                logger.error(f"Error re-fetching user {results[0].id} by email for UserInDB: {e}")
        return None

    def create_user(self, user_create: UserCreate, hashed_password: str) -> User:
        """Crea un nuovo utente con password hashata."""
        user_dict = self._to_dict(user_create)
        user_dict["password"] = hashed_password

        # Use base create method
        # The base `create` method returns the model type T (User), which doesn't have password
        # We need to handle the dict conversion and ID generation within this method
        # if we want to ensure the `password` field is indexed.

        doc_id = user_dict.pop("id", None) or generate_id()
        user_dict['id'] = doc_id # Put ID back for model creation if needed

        try:
            self.client.index(
                index=self.index_name,
                id=doc_id,
                body=user_dict,
                refresh="wait_for"
            )
            # Return User model (without password) based on input
            # Exclude password before creating the User model
            user_dict.pop('password', None)
            return User(**user_dict)
        except Exception as e:
            logger.error(f"Error creating user: {e}", exc_info=True)
            raise


class PreferenceRepository(BaseRepository[Preference, PreferenceCreate]):
    """Repository per le preferenze."""
    def __init__(self):
        super().__init__(Preference, INDEX_PREFERENCES)

    def get_by_user_id(self, user_id: str) -> List[Preference]:
        """Ottiene le preferenze di un utente."""
        if not user_id:
            return []
        query = {
            "query": {
                "term": {
                    "userId.keyword": user_id # Assuming userId is keyword for exact match
                }
            },
            "sort": [
                {"createdAt": {"order": "desc"}}
            ]
        }
        return self.search(query)


class TravelPackageRepository(BaseRepository[TravelPackage, TravelPackageCreate]):
    """Repository per i pacchetti di viaggio."""
    def __init__(self):
        super().__init__(TravelPackage, INDEX_TRAVEL_PACKAGES)

    def get_by_category(self, category: str) -> List[TravelPackage]:
        """Ottiene i pacchetti di viaggio per categoria."""
        query = {
            "query": {
                "match": {
                    "categories": category
                }
            }
        }
        return self.search(query)

    def get_recommended_packages(self, preferences: Preference) -> List[TravelPackage]:
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
        return self.search(query, size=3)


class BookingRepository(BaseRepository[Booking, BookingCreate]):
    """Repository per le prenotazioni."""
    def __init__(self):
        super().__init__(Booking, INDEX_BOOKINGS)

    def get_by_user_id(self, user_id: str) -> List[Booking]:
        """Ottiene le prenotazioni di un utente."""
        if not user_id:
            return []
        query = {
            "query": {
                "term": {
                    "userId.keyword": user_id # Assuming userId is keyword
                }
            },
            "sort": [
                {"bookingDate": {"order": "desc"}}
            ]
        }
        return self.search(query)

    def update_status(self, id: str, status: str) -> Optional[Booking]:
        """Aggiorna lo stato di una prenotazione."""
        return self.update(id, {"status": status})

    def update_payment_status(self, id: str, payment_status: str) -> Optional[Booking]:
        """Aggiorna lo stato di pagamento di una prenotazione."""
        return self.update(id, {"paymentStatus": payment_status})


# NEW: Repository for Saved Packages
class SavedPackageRepository(BaseRepository[SavedPackage, SavedPackage]): # Use SavedPackage for CreateT as well
    """Repository for saved travel packages."""
    def __init__(self):
        super().__init__(SavedPackage, INDEX_SAVED_PACKAGES)

    def find_by_user(self, user_id: str, size: int = 100) -> List[SavedPackage]:
        """Finds saved packages by user ID."""
        if not user_id:
            return []
        query = {
            "query": {
                "term": {
                    "userId.keyword": user_id # Ensure userId field is mapped as keyword for exact match
                }
            },
            "sort": [
                 # Sort by savedAt descending to show newest first
                {"savedAt": {"order": "desc"}} 
            ]
        }
        return self.search(query, size=size)

    def delete_for_user(self, package_id: str, user_id: str) -> bool:
        """Deletes a package only if it belongs to the specified user."""
        if not package_id or not user_id:
            return False
        try:
            # Use delete_by_query to ensure we only delete if userId matches
            response = self.client.delete_by_query(
                index=self.index_name,
                body={
                    "query": {
                        "bool": {
                            "filter": [
                                {"term": {"_id": package_id}},
                                {"term": {"userId.keyword": user_id}}
                            ]
                        }
                    }
                },
                refresh="wait_for"
            )
            deleted_count = response.get("deleted", 0)
            if deleted_count > 0:
                 logger.info(f"Successfully deleted saved package {package_id} for user {user_id}.")
                 return True
            else:
                 logger.warning(f"Saved package {package_id} not found or does not belong to user {user_id}. No documents deleted.")
                 return False # Package not found or didn't belong to the user
        except Exception as e:
            logger.error(f"Error deleting saved package {package_id} for user {user_id}: {e}", exc_info=True)
            return False

    # The create method from BaseRepository should work, but ensure it handles SavedPackage model
    # It will automatically add 'id' and 'savedAt' based on the model definition
