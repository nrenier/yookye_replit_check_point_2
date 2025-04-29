import logging
import os
import json
from flask import Blueprint, jsonify, request, g, session
from ..utils.travel_api_client import get_recommendations_from_api
from ..models.repositories import TravelPackageRepository, PreferenceRepository

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
reco_bp = Blueprint('recommendations', __name__)
package_repo = TravelPackageRepository()
pref_repo = PreferenceRepository()

@reco_bp.route('/', methods=['GET']) # Changed to GET
async def get_recommendations():
    """
    Get travel recommendations based on user preferences
    """
    logger.info("Ricevuta richiesta per raccomandazioni")
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401

    try:
        # Ottieni le preferenze dell'utente
        preferences = await pref_repo.get_by_user_id(user_id)
        if not preferences or len(preferences) == 0:
            return jsonify({"success": False, "message": "Nessuna preferenza trovata"}), 404

        # Usa la preferenza più recente
        latest_preference = preferences[-1]

        # Ottieni raccomandazioni basate su questa preferenza
        external_recommendations = get_recommendations_from_api(latest_preference)

        # Trasforma le raccomandazioni nel formato corretto
        recommended_packages = []
        if external_recommendations and "packages" in external_recommendations:
            for pkg in external_recommendations["packages"]:
                recommended_packages.append({
                    "id": pkg.get("id", ""),
                    "title": pkg.get("title", ""),
                    "description": pkg.get("description", ""),
                    "destination": pkg.get("destination", ""),
                    "imageUrl": pkg.get("imageUrl", ""),
                    "price": pkg.get("price", 0),
                    "rating": pkg.get("rating", ""),
                    "durationDays": pkg.get("durationDays", 0) or (int(pkg.get("duration", "0").split()[0]) if pkg.get("duration") else 0),
                    "durationNights": pkg.get("durationNights", 0) or (int(pkg.get("duration", "0").split()[0])-1 if pkg.get("duration") else 0),
                    "isRecommended": True
                })

        return jsonify(recommended_packages), 200
    except Exception as e:
        logger.error(f"Errore nel recuperare le raccomandazioni: {str(e)}")
        return jsonify({"success": False, "message": f"Errore: {str(e)}"}), 500