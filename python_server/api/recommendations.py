import logging
import os
import json
from flask import Blueprint, jsonify, request
from ..utils.travel_api_client import get_recommendations_from_api

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
reco_bp = Blueprint('recommendations', __name__)

@reco_bp.route('/', methods=['POST'])
def get_recommendations():
    """
    Get travel recommendations based on user preferences
    """
    logger.info("Ricevuta richiesta per raccomandazioni")
    try:
        # Get user preferences from request
        preferences = request.json
        logger.info(f"Preferenze ricevute: {json.dumps(preferences, indent=2)}")

        # Call external API or recommendation engine
        recommendations = get_recommendations_from_api(preferences)

        return jsonify(recommendations)
    except Exception as e:
        logger.error(f"Errore nell'ottenere raccomandazioni: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Errore nell'ottenere raccomandazioni dall'API esterna"
        }), 500