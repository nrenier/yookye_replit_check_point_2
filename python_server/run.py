
import logging
from python_server.app import init_app
from python_server.config.settings import PORT

# Configura il logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Inizializza e avvia l'applicazione Flask."""
    logger.info("Avvio del server Yookve...")
    app = init_app()
    app.run(host="0.0.0.0", port=PORT, debug=True)

if __name__ == "__main__":
    main()
