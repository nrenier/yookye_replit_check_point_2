from flask import Blueprint, request, jsonify, session

from ..models.repositories import PreferenceRepository, TravelPackageRepository
from ..utils.travel_api_client import TravelApiClient

reco_bp = Blueprint("recommendations", __name__)
pref_repo = PreferenceRepository()
travel_repo = TravelPackageRepository()
travel_api_client = TravelApiClient()

@reco_bp.route("", methods=["GET"])
async def get_recommendations():
    """Ottiene i pacchetti di viaggio raccomandati dall'API esterna."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Ottieni raccomandazioni dall'API esterna
    recommendations = travel_api_client.get_recommendations()
    
    if recommendations is None:
        return jsonify({"success": False, "message": "Errore nell'ottenere raccomandazioni dall'API esterna"}), 500
    
    if not recommendations:
         return jsonify({"success": False, "message": "Nessuna raccomandazione trovata per le tue preferenze"}), 404

    return jsonify(recommendations), 200