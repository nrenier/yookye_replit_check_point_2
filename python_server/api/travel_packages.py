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
import logging
from flask import Blueprint, jsonify, request
from ..models.repositories import TravelPackageRepository
from ..middleware import log_request

travel_bp = Blueprint("travel_packages", __name__)
logger = logging.getLogger(__name__)

@travel_bp.route("/", methods=["GET"])
@log_request()
def get_all_packages():
    """Recupera tutti i pacchetti di viaggio."""
    try:
        travel_repo = TravelPackageRepository()
        packages = travel_repo.get_all()
        # Converti gli oggetti TravelPackage in dizionari
        packages_dict = [pkg.dict() if hasattr(pkg, 'dict') else pkg for pkg in packages]
        return jsonify(packages_dict)
    except Exception as e:
        logger.error(f"Errore nel recupero dei pacchetti di viaggio: {str(e)}")
        return jsonify({"message": str(e)}), 500

@travel_bp.route("/category/<category>", methods=["GET"])
@log_request()
def get_packages_by_category(category):
    """Recupera i pacchetti di viaggio per categoria."""
    try:
        travel_repo = TravelPackageRepository()
        packages = travel_repo.get_by_category(category)
        # Converti gli oggetti TravelPackage in dizionari
        packages_dict = [pkg.dict() if hasattr(pkg, 'dict') else pkg for pkg in packages]
        return jsonify(packages_dict)
    except Exception as e:
        logger.error(f"Errore nel recupero dei pacchetti per categoria {category}: {str(e)}")
        return jsonify({"message": str(e)}), 500

@travel_bp.route("/<package_id>", methods=["GET"])
@log_request()
def get_package_by_id(package_id):
    """Recupera un pacchetto di viaggio per ID."""
    try:
        travel_repo = TravelPackageRepository()
        package = travel_repo.get_by_id(package_id)
        if not package:
            return jsonify({"message": "Pacchetto non trovato"}), 404
        # Converti l'oggetto TravelPackage in dizionario
        package_dict = package.dict() if hasattr(package, 'dict') else package
        return jsonify(package_dict)
    except Exception as e:
        logger.error(f"Errore nel recupero del pacchetto {package_id}: {str(e)}")
        return jsonify({"message": str(e)}), 500

@travel_bp.route("/search", methods=["GET"])
@log_request()
def search_packages():
    """Cerca pacchetti di viaggio in base a criteri."""
    try:
        query = request.args.get("q", "")
        destination = request.args.get("destination")
        min_price = request.args.get("minPrice")
        max_price = request.args.get("maxPrice")
        duration = request.args.get("duration")
        category = request.args.get("category")
        
        if min_price:
            min_price = float(min_price)
        if max_price:
            max_price = float(max_price)
        if duration:
            duration = int(duration)
            
        travel_repo = TravelPackageRepository()
        packages = travel_repo.search(
            query=query,
            destination=destination,
            min_price=min_price,
            max_price=max_price,
            duration=duration,
            category=category
        )
        
        # Converti gli oggetti TravelPackage in dizionari
        packages_dict = [pkg.dict() if hasattr(pkg, 'dict') else pkg for pkg in packages]
        return jsonify(packages_dict)
    except Exception as e:
        logger.error(f"Errore nella ricerca dei pacchetti: {str(e)}")
        return jsonify({"message": str(e)}), 500
