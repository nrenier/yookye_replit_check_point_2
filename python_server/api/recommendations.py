from flask import Blueprint, request, jsonify, session

from ..models.repositories import PreferenceRepository, TravelPackageRepository

reco_bp = Blueprint("recommendations", __name__)
pref_repo = PreferenceRepository()
travel_repo = TravelPackageRepository()

@reco_bp.route("", methods=["GET"])
async def get_recommendations():
    """Ottiene i pacchetti di viaggio raccomandati in base alle preferenze dell'utente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Ottieni le preferenze dell'utente
    preferences = await pref_repo.get_by_user_id(user_id)
    
    if not preferences:
        return jsonify({"success": False, "message": "Nessuna preferenza trovata"}), 404
    
    # Usa la preferenza più recente
    latest_preference = preferences[0]
    
    # Ottieni i pacchetti raccomandati
    recommendations = await travel_repo.get_recommended_packages(latest_preference)
    
    return jsonify(recommendations)