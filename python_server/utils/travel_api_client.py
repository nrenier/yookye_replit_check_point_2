import os
import requests
import logging
import json
from ..config.settings import API_URL, API_USERNAME, API_PASSWORD


logger = logging.getLogger(__name__)


def get_access_token():
    """
    Get JWT token for external API
    """
    try:
        token_url = f"{API_URL}/api/auth/token"
        payload = {
            "username": API_USERNAME,
            "password": API_PASSWORD
        }

        response = requests.post(
            token_url, 
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code != 200:
            logger.error(f"Error getting token: {response.text}")
            return None

        token_data = response.json()
        return token_data.get("access_token")
    except Exception as e:
        logger.error(f"Exception getting token: {str(e)}")
        return None


def get_recommendations_from_api(preference, job_id=None, itinerary=False):
    """
    Get recommendations from external API
    If job_id is provided, it will poll for the job status
    If itinerary is True, it will return the detailed itinerary format
    """
    try:
        # First get token
        token = get_access_token()
        if not token:
            logger.error("Failed to get access token")
            return {"error": "Failed to get access token"}

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # If job_id is provided, poll for the job status
        if job_id:
            status_url = f"{API_URL}/api/search/{job_id}"
            status_response = requests.get(status_url, headers=headers)

            if status_response.status_code != 200:
                logger.error(f"Error polling job: {status_response.text}")
                return {"error": f"Error polling job: {status_response.text}"}

            status_data = status_response.json()

            # If job is completed, get the results
            if status_data.get("status") == "COMPLETED":
                # If we want the detailed itinerary, use a different endpoint
                if itinerary:
                    itinerary_url = f"{API_URL}/api/search/{job_id}/itinerary"
                    itinerary_response = requests.get(itinerary_url, headers=headers)

                    if itinerary_response.status_code != 200:
                        logger.error(f"Error getting itinerary: {itinerary_response.text}")
                        # Fallback to normal results if itinerary endpoint fails
                        result_url = f"{API_URL}/api/search/{job_id}/result"
                        result_response = requests.get(result_url, headers=headers)

                        if result_response.status_code != 200:
                            logger.error(f"Error getting results: {result_response.text}")
                            return {"error": f"Error getting results: {result_response.text}"}

                        result_data = result_response.json()
                        # Process the standard result to create an itinerary format
                        return format_results_as_itinerary(result_data)

                    itinerary_data = itinerary_response.json()
                    return itinerary_data
                else:
                    # Normal package results
                    result_url = f"{API_URL}/api/search/{job_id}/result"
                    result_response = requests.get(result_url, headers=headers)

                    if result_response.status_code != 200:
                        logger.error(f"Error getting results: {result_response.text}")
                        return {"error": f"Error getting results: {result_response.text}"}

                    result_data = result_response.json()
                    return result_data
            else:
                # Return the status response
                return status_data

        # If no job_id, start a new search
        search_url = f"{API_URL}/api/search"

        # Map preference to input format
        search_input = map_preference_to_search_input(preference)

        search_response = requests.post(search_url, json=search_input, headers=headers)

        if search_response.status_code != 200:
            logger.error(f"Error searching: {search_response.text}")
            return {"error": f"Error searching: {search_response.text}"}

        search_data = search_response.json()
        return search_data
    except Exception as e:
        logger.error(f"Exception in recommendations: {str(e)}")
        return {"error": str(e)}


def format_results_as_itinerary(results_data):
    """
    Format standard results as an itinerary format
    """
    try:
        # Extract destinations from the packages
        destinations = []
        accommodations = []
        experiences = []

        # Process packages to extract information
        if "packages" in results_data:
            # Get unique destinations
            destinations_set = set()
            for pkg in results_data["packages"]:
                if "destination" in pkg and pkg["destination"]:
                    destinations_set.add(pkg["destination"])

            destinations = list(destinations_set)

            # Extract accommodations
            for pkg in results_data["packages"]:
                if pkg.get("accommodationName") and pkg.get("accommodationType"):
                    accommodation = {
                        "name": pkg.get("accommodationName", ""),
                        "type": pkg.get("accommodationType", ""),
                        "location": pkg.get("destination", ""),
                        "description": f"Sistemazione prevista nel pacchetto {pkg.get('title', '')}",
                        "rating": pkg.get("rating", ""),
                        "price": pkg.get("price", 0),
                        "nights": pkg.get("durationNights", 0),
                        "imageUrl": pkg.get("imageUrl", "")
                    }
                    accommodations.append(accommodation)

            # Extract experiences
            for pkg in results_data["packages"]:
                if pkg.get("experiences"):
                    for exp in pkg.get("experiences", []):
                        experience = {
                            "name": exp,
                            "location": pkg.get("destination", ""),
                            "description": f"Esperienza inclusa nel pacchetto {pkg.get('title', '')}",
                            "duration": "Variabile",
                            "price": "Incluso nel pacchetto"
                        }
                        experiences.append(experience)

        return {
            "destinations": destinations,
            "accommodations": accommodations,
            "experiences": experiences
        }
    except Exception as e:
        logger.error(f"Error formatting results as itinerary: {str(e)}")
        return {
            "destinations": [],
            "accommodations": [],
            "experiences": []
        }


def map_preference_to_search_input(preference):
    """
    Map a preference to the search input format
    """
    try:
        # This is just a placeholder - customize this mapping based on your preference model
        # and the expected input for the external API
        return {
            "interessi": {
                "storia_e_arte": {
                    "siti_archeologici": "archeologia" in (preference.interests or []),
                    "musei_e_gallerie": "musei" in (preference.interests or []),
                    "monumenti_e_architettura": "architettura" in (preference.interests or [])
                },
                "Food_&_wine": {
                    "visite_alle_cantine": "cantine" in (preference.interests or []),
                    "soggiorni_nella_wine_country": "wine_country" in (preference.interests or []),
                    "corsi_di_cucina": "corsi_cucina" in (preference.interests or [])
                },
                "vacanze_attive": {
                    "trekking_di_più_giorni": "trekking" in (preference.interests or []),
                    "tour_in_e_bike_di_più_giorno": "ebike" in (preference.interests or []),
                    "tour_in_bicicletta_di_più_giorni": "bicicletta" in (preference.interests or []),
                    "sci_snowboard_di_più_giorni": "sci" in (preference.interests or [])
                },
                "vita_locale": "local_life" in (preference.interests or []),
                "salute_e_benessere": "benessere" in (preference.interests or [])
            },
            "luoghi_da_non_perdere": {
                "luoghi_specifici": preference.destination is not None,
                "city": preference.destination or ""
            },
            "mete_clou": {
                "destinazioni_popolari": preference.travelType == "popolari",
                "destinazioni_avventura": preference.travelType == "avventura",
                "entrambe": preference.travelType == "entrambi"
            },
            "budget_per_persona_giorno": {
                "economico": preference.budget == "economy",
                "fascia_media": preference.budget == "mid_range",
                "comfort": preference.budget == "comfort",
                "lusso": preference.budget == "luxury",
                "nessun_budget": preference.budget == "no_limit"
            },
            "date": {
                "check_in_time": preference.departureDate or "",
                "check_out_time": preference.returnDate or ""
            },
            "viaggiatori": {
                "adults_number": preference.numAdults or 2,
                "children_number": preference.numChildren or 0,
                "baby_number": preference.numInfants or 0,
                "Room_number": 1  # Default value
            }
        }
    except Exception as e:
        logger.error(f"Error mapping preference: {str(e)}")
        return {}