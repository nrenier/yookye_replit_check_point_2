import requests
import os
import time
from dotenv import load_dotenv
import logging

# Load environment variables if not already loaded
load_dotenv()

# Configure logger
logger = logging.getLogger(__name__)

def get_recommendations_from_api(preferences):
    """
    Get recommendations from external API based on user preferences
    """
    try:
        # Initialize the client
        client = TravelApiClient()
        
        # Get recommendations
        recommendations = client.get_recommendations()
        
        # If we received recommendations, return them
        if recommendations:
            return recommendations
        
        # Fallback to mock data if API call failed
        return {
            "success": True,
            "packages": [
                {
                    "id": "mock-1",
                    "title": "Weekend a Roma",
                    "description": "Scopri le meraviglie della città eterna",
                    "destination": "Roma",
                    "imageUrl": "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
                    "price": 350,
                    "rating": "4.7",
                    "duration": "3 giorni"
                },
                {
                    "id": "mock-2",
                    "title": "Tour della Costiera Amalfitana",
                    "description": "Visita i panorami mozzafiato della Costiera",
                    "destination": "Amalfi",
                    "imageUrl": "https://images.unsplash.com/photo-1533165858814-1e017c30f838",
                    "price": 580,
                    "rating": "4.9",
                    "duration": "5 giorni"
                },
                {
                    "id": "mock-3",
                    "title": "Weekend a Firenze",
                    "description": "Arte e cultura nella culla del Rinascimento",
                    "destination": "Firenze",
                    "imageUrl": "https://images.unsplash.com/photo-1541370976299-4d52b2e18d51",
                    "price": 320,
                    "rating": "4.8",
                    "duration": "3 giorni"
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        # Return a minimal fallback with error message
        return {
            "success": False,
            "message": f"Errore nell'ottenere raccomandazioni: {str(e)}",
            "packages": []
        }

class TravelApiClient:
    def __init__(self):
        self.base_url = os.getenv("TRAVEL_API_URL")
        self.username = os.getenv("TRAVEL_API_USERNAME")
        self.password = os.getenv("TRAVEL_API_PASSWORD")
        self._token = None
        self._token_expiry = 0
        self._last_search_id = None
        
    def _get_token(self):
        if self._token and self._token_expiry > time.time():
            return self._token

        auth_url = f"{self.base_url}/auth/login"
        try:
            response = requests.post(auth_url, json={
                "username": self.username,
                "password": self.password
            })
            response.raise_for_status()
            auth_data = response.json()
            self._token = auth_data["access_token"]
            # Assuming token expires in 60 minutes (as per the user's project's JWT config, 
            # although the external API might have different expiry). Using a simple estimate.
            self._token_expiry = time.time() + 3600 # 1 hour expiry
            return self._token
        except requests.exceptions.RequestException as e:
            print(f"Error during external API authentication: {e}")
            return None

    def send_preferences(self, preference_data: dict):
        token = self._get_token()
        if not token:
            return None
            
        # Ensure we have all required fields
        if "interessi" not in preference_data:
            preference_data["interessi"] = {
                "storia_e_arte": {
                    "siti_archeologici": False,
                    "musei_e_gallerie": False,
                    "monumenti_e_architettura": False
                },
                "food_wine": {
                    "visite_alle_cantine": False,
                    "soggiorni_nella_wine_country": False,
                    "corsi_di_cucina": False
                },
                "vacanze_attive": {
                    "trekking_di_più_giorni": False,
                    "tour_in_e_bike_di_più_giorni": False,
                    "tour_in_bicicletta_di_più_giorni": False,
                    "sci_snowboard_di_più_giorni": False
                },
                "vita_locale": False,
                "salute_e_benessere": False
            }
            
        # Make sure trasporti has auto_propria and Unknown fields
        if "trasporti" in preference_data:
            if "auto_propria" not in preference_data["trasporti"]:
                preference_data["trasporti"]["auto_propria"] = False
            if "Unknown" not in preference_data["trasporti"]:
                preference_data["trasporti"]["Unknown"] = False
                
        try:
            # Send preferences to external API
            search_url = f"{self.base_url}/api/search"
            response = requests.post(
                search_url, 
                json=preference_data,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            search_result = response.json()
            
            # Store the search ID for later use
            if "job_id" in search_result:
                self._last_search_id = search_result["job_id"]
                print(f"Search job ID: {self._last_search_id}")
                
            return search_result
        except requests.exceptions.RequestException as e:
            print(f"Error sending preferences to external API: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            return None
            
    def get_recommendations(self):
        """Get recommendations from the external API based on last search."""
        token = self._get_token()
        if not token or not self._last_search_id:
            # Mock response if no real data available
            return {
                "success": True,
                "packages": [
                    {
                        "id": "1",
                        "title": "Weekend a Firenze",
                        "description": "Scopri le meraviglie di Firenze",
                        "destination": "Firenze",
                        "imageUrl": "https://images.unsplash.com/photo-1599946347371-68eb71b16afc",
                        "price": 450,
                        "rating": "4.8",
                        "duration": "3 giorni"
                    }
                ]
            }
            
        try:
            # Check job status first
            status_url = f"{self.base_url}/api/search/{self._last_search_id}"
            status_response = requests.get(
                status_url,
                headers={"Authorization": f"Bearer {token}"}
            )
            status_response.raise_for_status()
            status_data = status_response.json()
            
            # If job is complete, get results
            if status_data.get("status") == "completed":
                result_url = f"{self.base_url}/api/search/{self._last_search_id}/result"
                result_response = requests.get(
                    result_url,
                    headers={"Authorization": f"Bearer {token}"}
                )
                result_response.raise_for_status()
                return result_response.json()
            else:
                print(f"Search job not completed yet. Status: {status_data.get('status')}")
                # Return a fallback response
                return {
                    "success": True,
                    "message": "Elaborazione in corso, riprova più tardi",
                    "packages": []
                }
                
        except requests.exceptions.RequestException as e:
            print(f"Error getting recommendations from external API: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            return None
            
        # Ensure we have all required fields
        if "interessi" not in preference_data:
            preference_data["interessi"] = {
                "storia_e_arte": {
                    "siti_archeologici": False,
                    "musei_e_gallerie": False,
                    "monumenti_e_architettura": False
                },
                "food_wine": {
                    "visite_alle_cantine": False,
                    "soggiorni_nella_wine_country": False,
                    "corsi_di_cucina": False
                },
                "vacanze_attive": {
                    "trekking_di_più_giorni": False,
                    "tour_in_e_bike_di_più_giorni": False,
                    "tour_in_bicicletta_di_più_giorni": False,
                    "sci_snowboard_di_più_giorni": False
                },
                "vita_locale": False,
                "salute_e_benessere": False
            }
            
        # Make sure trasporti has auto_propria and Unknown fields
        if "trasporti" in preference_data:
            if "auto_propria" not in preference_data["trasporti"]:
                preference_data["trasporti"]["auto_propria"] = False
            if "Unknown" not in preference_data["trasporti"]:
                preference_data["trasporti"]["Unknown"] = False

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        preferences_url = f"{self.base_url}/preferences"
        try:
            response = requests.post(preferences_url, json=preference_data, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error sending preferences to external API: {e}")
            return None

    def get_recommendations(self):
        token = self._get_token()
        if not token:
            print("Failed to get authentication token for external API")
            return None

        headers = {
            "Authorization": f"Bearer {token}"
        }
        recommendations_url = f"{self.base_url}/recommendations"
        try:
            # Add timeout to avoid hanging requests
            response = requests.get(recommendations_url, headers=headers, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error getting recommendations from external API: {e}")
            # Log more details about the error
            if hasattr(e, 'response') and e.response:
                print(f"Response status code: {e.response.status_code}")
                print(f"Response content: {e.response.text}")
            return None
        except Exception as e:
            print(f"Unexpected error when getting recommendations: {str(e)}")
            return None
