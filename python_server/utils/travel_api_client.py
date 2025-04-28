import requests
import os
import time
from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

class TravelApiClient:
    def __init__(self):
        self.base_url = os.getenv("TRAVEL_API_URL")
        self.username = os.getenv("TRAVEL_API_USERNAME")
        self.password = os.getenv("TRAVEL_API_PASSWORD")
        self._token = None
        self._token_expiry = 0

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
            return None

        headers = {
            "Authorization": f"Bearer {token}"
        }
        recommendations_url = f"{self.base_url}/recommendations"
        try:
            response = requests.get(recommendations_url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error getting recommendations from external API: {e}")
            return None
