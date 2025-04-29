import os
import logging
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from .config.settings import SECRET_KEY, CORS_ORIGINS, PORT, DEBUG #Added PORT and DEBUG from original file
from .api.auth import auth_bp
from .api.travel_packages import travel_bp as travel_package_bp
from .api.preferences import pref_bp
from .api.recommendations import reco_bp
from .api.bookings import booking_bp
from .middleware import log_request #Kept from original file


# Configurazione del logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_app():
    """Inizializza l'applicazione Flask."""
    app = Flask(__name__, static_folder=None)
    app.config['SECRET_KEY'] = SECRET_KEY

    # Configura CORS
    CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})

    # Registra i blueprint
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(travel_package_bp, url_prefix='/api/travel-packages')
    app.register_blueprint(pref_bp, url_prefix='/api/preferences')
    app.register_blueprint(reco_bp, url_prefix='/api/recommendations')
    app.register_blueprint(booking_bp, url_prefix='/api/bookings')

    # Versione della API
    @app.route('/api/version')
    def version():
        return jsonify({"version": "1.0.0"})

    # Percorso della cartella dist, una directory sopra la directory python_server
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'public')

    # Servi i file statici dalla cartella dist/public
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        try:
            if path and os.path.exists(os.path.join(dist_dir, path)):
                return send_from_directory(dist_dir, path)
            else:
                # Se il file non esiste o è richiesta la root, servi index.html
                logger.info(f"Serving index.html for path: {path}")
                return send_from_directory(dist_dir, 'index.html')
        except Exception as e:
            logger.error(f"Errore nel servire i file statici: {str(e)}")
            return str(e), 404

    # Rotta di test (Kept from original)
    @app.route("/api/ping", methods=["GET"])
    @log_request()
    def ping():
        return jsonify({"message": "pong"})

    # Rotta per le richieste Stripe (Kept from original)
    @app.route("/api/create-payment-intent", methods=["POST"])
    @log_request()
    def create_payment_intent():
        from .api.bookings import create_payment_intent_handler
        return create_payment_intent_handler()

    @app.route("/api/webhook", methods=["POST"])
    def stripe_webhook():
        from .api.bookings import webhook_handler
        return webhook_handler()

    # Gestore degli errori (Kept from original)
    @app.errorhandler(404)
    def not_found(e):
        try:
            return send_from_directory(dist_dir, 'index.html') #Using dist_dir here as well
        except Exception as err:
            logger.error(f"Errore nel servire index.html: {str(err)}")
            return jsonify({"error": "Risorsa non trovata"}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"success": False, "message": "Errore del server"}), 500

    return app

if __name__ == '__main__':
    app = init_app()
    app.run(debug=DEBUG, host='0.0.0.0', port=PORT) #Using PORT and DEBUG from original file