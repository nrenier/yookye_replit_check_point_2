from flask import Flask, jsonify
from flask_cors import CORS
import logging
import os

from .config.settings import PORT, DEBUG, SECRET_KEY
from .config.opensearch_client import init_indices, seed_travel_packages
from .api.auth import auth_bp
from .api.travel_packages import travel_bp
from .api.preferences import pref_bp
from .api.bookings import booking_bp
from .api.recommendations import reco_bp

# Configura il logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Crea e configura l'applicazione Flask."""
    app = Flask(__name__)
    
    # Configurazione dell'app
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["SESSION_TYPE"] = "filesystem"
    
    # Configura CORS
    CORS(app, supports_credentials=True)
    
    # Registra le blueprint
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(travel_bp, url_prefix="/api/travel-packages")
    app.register_blueprint(pref_bp, url_prefix="/api/preferences")
    app.register_blueprint(booking_bp, url_prefix="/api/bookings")
    app.register_blueprint(reco_bp, url_prefix="/api/recommendations")
    
    # Rotta di test
    @app.route("/api/ping", methods=["GET"])
    def ping():
        return jsonify({"message": "pong"})
    
    # Gestore degli errori
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "message": "Non trovato"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"success": False, "message": "Errore del server"}), 500
    
    return app

def init_app():
    """Inizializza l'applicazione e il database."""
    # Inizializza gli indici OpenSearch
    init_indices()
    
    # Seed dei dati di esempio
    seed_travel_packages()
    
    return create_app()

if __name__ == "__main__":
    app = init_app()
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)