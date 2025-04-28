import logging
from .app import init_app

# Configura il logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Inizializza e avvia l'applicazione Flask."""
    logger.info("Avvio del server Yookve...")
    app = init_app()
    app.run(host="0.0.0.0", port=5000, debug=True)

if __name__ == "__main__":
    main()