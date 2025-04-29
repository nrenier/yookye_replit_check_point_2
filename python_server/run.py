
import logging
import sys
import os

# Aggiungi la directory principale al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ora importa i moduli
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
