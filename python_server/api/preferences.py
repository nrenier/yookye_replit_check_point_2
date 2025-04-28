from flask import Blueprint, request, jsonify, session

from ..models.repositories import PreferenceRepository
from ..models.models import PreferenceCreate

pref_bp = Blueprint("preferences", __name__)
pref_repo = PreferenceRepository()

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
    """Crea una nuova preferenza."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        data = request.json
        data["userId"] = user_id
        
        # Crea la preferenza
        preference_create = PreferenceCreate(**data)
        preference = await pref_repo.create(preference_create)
        
        return jsonify(preference), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400