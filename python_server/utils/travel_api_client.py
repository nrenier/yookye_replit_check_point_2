import os
import requests
import logging
from time import sleep

logger = logging.getLogger(__name__)

class TravelApiClient:
    """Client for interacting with the external travel API."""

    def __init__(self):
        """Initialize the TravelApiClient with configuration."""
        self.base_url = os.environ.get("TRAVEL_API_URL", "http://localhost:8000")
        self.username = os.environ.get("TRAVEL_API_USERNAME", "")
        self.password = os.environ.get("TRAVEL_API_PASSWORD", "")
        self._token = None
        self._token_expiry = 0
        self._last_search_id = None

    def _get_token(self):
        """Get a valid authentication token from the API."""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/token",
                data={
                    "username": self.username,
                    "password": self.password
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            response.raise_for_status()
            token_data = response.json()
            self._token = token_data.get("access_token")
            return self._token
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting authentication token: {e}")
            return None

    def send_preferences(self, preference_data: dict):
        """Send user preferences to the external API."""
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
                "Food_&_wine": {
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
                
                # Try to parse and print more detailed error information
                try:
                    error_data = e.response.json()
                    print(f"Detailed API error: {json.dumps(error_data, indent=2)}")
                    
                    # Print the actual request payload for debugging
                    print(f"Request payload sent: {json.dumps(preference_data, indent=2)}")
                except:
                    print("Could not parse error response as JSON")
            return None

    def get_recommendations(self):
        """Get recommendations from the external API based on last search."""
        token = self._get_token()
        if not token or not self._last_search_id:
            # Mock response if no real data available
            return {
                "success": True,
                "message": "Elaborazione in corso, riprova più tardi",
                "packages": []
            }

        try:
            # Try to get the search result using the job ID
            result_url = f"{self.base_url}/api/search/{self._last_search_id}/result"
            response = requests.get(
                result_url,
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )

            # If the job is still processing, we might get a 404 or other status code
            if response.status_code == 404 or response.status_code == 202:
                print(f"Job {self._last_search_id} is still processing. Status: {response.status_code}")
                return {
                    "success": True,
                    "message": "Elaborazione in corso, riprova più tardi",
                    "packages": []
                }

            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error getting recommendations from external API: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            return None

def get_recommendations_from_api(preferences):
    """
    Get recommendations from external API based on user preferences
    """
    try:
        # Initialize the client
        client = TravelApiClient()

        # Get recommendations
        recommendations = client.get_recommendations()

        # Check if we have city-based data
        if recommendations and isinstance(recommendations, dict) and ("accomodation" in recommendations or "esperienze" in recommendations):
            return recommendations

        # If we received traditional recommendations, return them
        if recommendations and "packages" in recommendations:
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
                }
            ]
        }
    except Exception as e:
        import traceback
        print(f"Error in get_recommendations_from_api: {str(e)}")
        print(traceback.format_exc())
        return {
            "success": False,
            "message": f"Errore nel recuperare le raccomandazioni: {str(e)}",
            "packages": []
        }