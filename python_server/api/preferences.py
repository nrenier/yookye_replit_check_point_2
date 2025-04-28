from flask import Blueprint, request, jsonify, session

from ..models.repositories import PreferenceRepository
from ..models.models import PreferenceCreate
from ..utils.travel_api_client import TravelApiClient

pref_bp = Blueprint("preferences", __name__)
pref_repo = PreferenceRepository()

travel_api_client = TravelApiClient()

@pref_bp.route("", methods=["GET"])
async def get_preferences():
    """Ottiene le preferenze dell'utente corrente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Ottieni le preferenze
    preferences = await pref_repo.get_by_user_id(user_id)
    return jsonify(preferences)

@pref_bp.route("", methods=["POST"])
async def create_preference():
    """Crea una nuova preferenza e ottiene raccomandazioni dall'API esterna."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        data = request.json
        data["userId"] = user_id
        
        # Crea la preferenza nel DB locale
        preference_create = PreferenceCreate(**data)
        # await pref_repo.create(preference_create) # Decide if we still need to save locally
        
        # Invia le preferenze all'API esterna
        external_pref_response = travel_api_client.send_preferences(data)
        if external_pref_response is None:
             return jsonify({"success": False, "message": "Errore nell'invio delle preferenze all'API esterna"}), 500

        # Ottieni raccomandazioni dall'API esterna
        recommendations = travel_api_client.get_recommendations()
        if recommendations is None:
             return jsonify({"success": False, "message": "Errore nell'ottenere raccomandazioni dall'API esterna"}), 500

        return jsonify(recommendations), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400
