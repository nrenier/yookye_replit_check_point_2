from flask import Blueprint, request, jsonify, session
import logging
from opensearchpy import OpenSearch
import os
from dotenv import load_dotenv
import traceback

from ..models.repositories import PreferenceRepository, TravelPackageRepository
from ..utils.travel_api_client import TravelApiClient

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

reco_bp = Blueprint("recommendations", __name__)
pref_repo = PreferenceRepository()
travel_repo = TravelPackageRepository()
travel_api_client = TravelApiClient()

# OpenSearch client configuration
opensearch_host = os.getenv('OPENSEARCH_HOST', 'localhost')
opensearch_port = int(os.getenv('OPENSEARCH_PORT', 9200))
opensearch_index = 'travel_packages'

# Initialize OpenSearch client
try:
    opensearch_client = OpenSearch(
        hosts=[{'host': opensearch_host, 'port': opensearch_port}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
        ssl_show_warn=False
    )
    logger.info("OpenSearch client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize OpenSearch client: {str(e)}")
    opensearch_client = None

@reco_bp.route("", methods=["GET"])
async def get_recommendations():
    """Ottieni raccomandazioni di viaggio per l'utente corrente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        # Ottieni le preferenze dell'utente
        preferences = await pref_repo.get_by_user_id(user_id)
        if not preferences:
            return jsonify({"success": False, "message": "Nessuna preferenza trovata"}), 404
        
        # Ottieni le raccomandazioni dall'API esterna
        recommendations = travel_api_client.get_recommendations()
        if recommendations is None:
            return jsonify({"success": False, "message": "Errore nell'ottenere raccomandazioni dall'API esterna"}), 500
        
        return jsonify(recommendations), 200
    except Exception as e:
        logger.error(f"Errore nel recupero delle raccomandazioni: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "message": f"Errore nell'ottenere raccomandazioni: {str(e)}"}), 500

def get_recommended_packages_from_opensearch():
    """Get recommended travel packages from OpenSearch."""
    try:
        if not opensearch_client:
            logger.error("OpenSearch client not available")
            return None

        # Query for packages that are marked as recommended
        query = {
            "query": {
                "term": {
                    "isRecommended": True
                }
            },
            "size": 3
        }

        response = opensearch_client.search(
            body=query,
            index=opensearch_index
        )

        if response and response.get('hits') and response['hits'].get('hits'):
            # Extract packages from the response
            packages = [hit['_source'] for hit in response['hits']['hits']]
            return packages
        
        # Fallback to get any packages if no recommended ones are found
        fallback_query = {
            "query": {
                "match_all": {}
            },
            "size": 3
        }
        
        fallback_response = opensearch_client.search(
            body=fallback_query,
            index=opensearch_index
        )
        
        if fallback_response and fallback_response.get('hits') and fallback_response['hits'].get('hits'):
            packages = [hit['_source'] for hit in fallback_response['hits']['hits']]
            return packages
            
        return None
    except Exception as e:
        logger.error(f"Error getting recommended packages from OpenSearch: {str(e)}")
        return None

@reco_bp.route("", methods=["GET"])
async def get_recommendations():
    """Ottiene i pacchetti di viaggio raccomandati."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        # First try to get recommendations from the external API
        recommendations = travel_api_client.get_recommendations()
        
        # If external API fails, use OpenSearch as fallback
        if recommendations is None:
            logger.info("External API failed, using OpenSearch as fallback")
            recommendations = get_recommended_packages_from_opensearch()
            
            if recommendations is None:
                return jsonify({"success": False, "message": "Errore nell'ottenere raccomandazioni"}), 500
        
        if not recommendations:
            return jsonify({"success": False, "message": "Nessuna raccomandazione trovata per le tue preferenze"}), 404

        return jsonify(recommendations), 200
    except Exception as e:
        logger.error(f"Error in recommendations endpoint: {str(e)}")
        return jsonify({"success": False, "message": f"Errore del server: {str(e)}"}), 500