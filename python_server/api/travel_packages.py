from flask import Blueprint, request, jsonify, session

from ..models.repositories import TravelPackageRepository
from ..models.models import TravelPackageCreate

travel_bp = Blueprint("travel", __name__)
travel_repo = TravelPackageRepository()

@travel_bp.route("", methods=["GET"])
async def get_all_packages():
    """Ottiene tutti i pacchetti di viaggio."""
    packages = await travel_repo.get_all()
    return jsonify(packages)

@travel_bp.route("/<id>", methods=["GET"])
async def get_package(id):
    """Ottiene un pacchetto di viaggio per ID."""
    package = await travel_repo.get_by_id(id)
    if not package:
        return jsonify({"success": False, "message": "Pacchetto di viaggio non trovato"}), 404
    
    return jsonify(package)

@travel_bp.route("/category/<category>", methods=["GET"])
async def get_packages_by_category(category):
    """Ottiene i pacchetti di viaggio per categoria."""
    packages = await travel_repo.get_by_category(category)
    return jsonify(packages)

@travel_bp.route("", methods=["POST"])
async def create_package():
    """Crea un nuovo pacchetto di viaggio."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        data = request.json
        package_create = TravelPackageCreate(**data)
        package = await travel_repo.create(package_create)
        return jsonify(package), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400