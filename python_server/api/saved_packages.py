from flask import Blueprint, request, jsonify, session
from ..models.repositories import SavedPackageRepository, UserRepository
from ..utils.auth import login_required
import traceback

saved_packages_bp = Blueprint("saved_packages", __name__)
saved_package_repo = SavedPackageRepository()
user_repo = UserRepository()

@saved_packages_bp.route("", methods=["POST"])
@login_required
def save_package(current_user):
    """Salva un pacchetto per l'utente corrente."""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "Nessun dato fornito"}), 400

        # Aggiungi l'ID dell'utente corrente ai dati
        data["user_id"] = current_user["_id"]

        # Log per debugging
        print(f"Saving package for user {current_user['_id']}: {data}")

        # Salva il pacchetto
        saved_package = saved_package_repo.create(data)
        # Converti l'oggetto SavedPackage in un dizionario
        package_data = saved_package.dict() if hasattr(saved_package, 'dict') else saved_package

        return jsonify({
            "success": True,
            "data": package_data
        })
    except Exception as e:
        print(f"Error saving package: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Errore nel salvare il pacchetto"
        }), 500

@saved_packages_bp.route("", methods=["GET"])
@login_required
def get_saved_packages(current_user):
    """Ottiene tutti i pacchetti salvati dall'utente corrente."""
    try:
        # Ottieni i pacchetti
        packages = saved_package_repo.find_by_user(current_user["_id"])
        
        # Converti i pacchetti in formato serializzabile
        serialized_packages = []
        for package in packages:
            if hasattr(package, 'dict'):
                serialized_packages.append(package.dict())
            else:
                # Fallback se package non ha il metodo dict()
                serialized_packages.append(package)
        
        return jsonify({
            "success": True,
            "data": serialized_packages
        })
    except Exception as e:
        print(f"Error retrieving saved packages: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Errore nel recuperare i pacchetti salvati"
        }), 500

# Endpoint di debug per testare l'autenticazione
@saved_packages_bp.route("/test-auth", methods=["GET"])
def test_auth():
    """Test endpoint per verificare lo stato dell'autenticazione."""
    user_id = session.get("user_id")
    auth_header = request.headers.get("Authorization")

    return jsonify({
        "success": True,
        "auth_status": {
            "session_user_id": user_id is not None,
            "auth_header_present": auth_header is not None,
            "session_data": dict(session) if user_id else {}
        }
    })