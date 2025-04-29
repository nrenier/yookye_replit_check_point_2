
import time
import json
import logging
from functools import wraps
from flask import request, g

logger = logging.getLogger(__name__)

def log_request():
    """Middleware per loggare le richieste API."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Registra il tempo di inizio
            start_time = time.time()
            
            # Memorizza il percorso della richiesta
            request_path = request.path
            
            # Esegui la funzione di vista
            response = f(*args, **kwargs)
            
            # Calcola la durata
            duration = int((time.time() - start_time) * 1000)  # in millisecondi
            
            # Logga solo le richieste API
            if request_path.startswith('/api'):
                log_data = {
                    "method": request.method,
                    "path": request_path,
                    "status": response.status_code,
                    "duration": f"{duration}ms"
                }
                
                # Se la risposta contiene dati JSON, aggiungiamo un estratto
                if response.is_json and response.json:
                    response_json = json.dumps(response.json)
                    if len(response_json) > 80:
                        response_json = response_json[:79] + "…"
                    log_data["response"] = response_json
                
                # Crea la linea di log
                log_line = f"{log_data['method']} {log_data['path']} {log_data['status']} in {log_data['duration']}"
                if "response" in log_data:
                    log_line += f" :: {log_data['response']}"
                
                logger.info(log_line)
            
            return response
        return decorated_function
    return decorator
