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
        
        # Utilizziamo una query diretta al posto del metodo asincrono
        response = travel_repo.client.search(
            index=travel_repo.index_name,
            body={"query": {"match_all": {}}},
            size=100
        )
        
        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["id"] = hit["_id"]
            results.append(data)
            
        return jsonify(results)
    except Exception as e:
        logger.error(f"Errore nel recupero dei pacchetti di viaggio: {str(e)}")
        return jsonify({"message": str(e)}), 500

@travel_bp.route("/category/<category>", methods=["GET"])
@log_request()
def get_packages_by_category(category):
    """Recupera i pacchetti di viaggio per categoria."""
    try:
        travel_repo = TravelPackageRepository()
        # Utilizziamo una query diretta al posto del metodo asincrono
        query = {
            "query": {
                "match": {
                    "categories": category
                }
            }
        }
        
        response = travel_repo.client.search(
            index=travel_repo.index_name,
            body=query,
            size=100
        )
        
        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["id"] = hit["_id"]
            results.append(data)
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Errore nel recupero dei pacchetti per categoria {category}: {str(e)}")
        return jsonify({"message": str(e)}), 500

@travel_bp.route("/<package_id>", methods=["GET"])
@log_request()
def get_package_by_id(package_id):
    """Recupera un pacchetto di viaggio per ID."""
    try:
        travel_repo = TravelPackageRepository()
        
        # Utilizziamo il metodo get diretto di OpenSearch
        try:
            response = travel_repo.client.get(
                index=travel_repo.index_name,
                id=package_id
            )
            
            if response["found"]:
                data = response["_source"]
                data["id"] = response["_id"]
                return jsonify(data)
            else:
                return jsonify({"message": "Pacchetto non trovato"}), 404
                
        except Exception as e:
            logger.error(f"Errore nel recupero del pacchetto {package_id}: {str(e)}")
            return jsonify({"message": "Pacchetto non trovato"}), 404
            
    except Exception as e:
        logger.error(f"Errore nel recupero del pacchetto {package_id}: {str(e)}")
        return jsonify({"message": str(e)}), 500

@travel_bp.route("/search", methods=["GET"])
@log_request()
def search_packages():
    """Cerca pacchetti di viaggio in base a criteri."""
    try:
        query_text = request.args.get("q", "")
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
            
        # Costruisci la query OpenSearch
        must_clauses = []
        should_clauses = []
        filter_clauses = []
        
        # Ricerca testuale generale
        if query_text:
            should_clauses.append({
                "multi_match": {
                    "query": query_text,
                    "fields": ["title", "description", "destination"]
                }
            })
        
        # Filtri per campi specifici
        if destination:
            must_clauses.append({
                "match": {
                    "destination.keyword": destination
                }
            })
        
        if category:
            must_clauses.append({
                "match": {
                    "categories": category
                }
            })
        
        # Range di prezzo
        price_range = {}
        if min_price is not None:
            price_range["gte"] = min_price
        if max_price is not None:
            price_range["lte"] = max_price
        
        if price_range:
            filter_clauses.append({
                "range": {
                    "price": price_range
                }
            })
        
        # Durata
        if duration:
            filter_clauses.append({
                "term": {
                    "durationDays": duration
                }
            })
        
        # Costruisci la query finale
        es_query = {
            "query": {
                "bool": {}
            }
        }
        
        if must_clauses:
            es_query["query"]["bool"]["must"] = must_clauses
        if should_clauses:
            es_query["query"]["bool"]["should"] = should_clauses
            if not must_clauses:  # Se non ci sono must, allora almeno uno dei should deve corrispondere
                es_query["query"]["bool"]["minimum_should_match"] = 1
        if filter_clauses:
            es_query["query"]["bool"]["filter"] = filter_clauses
        
        # Se non ci sono clausole, cerca tutto
        if not must_clauses and not should_clauses and not filter_clauses:
            es_query["query"] = {"match_all": {}}
        
        travel_repo = TravelPackageRepository()
        response = travel_repo.client.search(
            index=travel_repo.index_name,
            body=es_query,
            size=100
        )
        
        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["id"] = hit["_id"]
            results.append(data)
            
        return jsonify(results)
    except Exception as e:
        logger.error(f"Errore nella ricerca dei pacchetti: {str(e)}")
        return jsonify({"message": str(e)}), 500
