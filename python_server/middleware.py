
import time
import json
import logging
import asyncio
from functools import wraps
from flask import request, g

logger = logging.getLogger(__name__)

def log_request():
    """Middleware per loggare le richieste API."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            logger.info(f"Richiesta a {request.path} con metodo {request.method}")

            try:
                response = f(*args, **kwargs)
                
                # Gestione funzioni asincrone
                if asyncio.iscoroutine(response):
                    response = asyncio.run(response)
                    
                end_time = time.time()
                execution_time = end_time - start_time
                logger.info(f"Risposta da {request.path}: {getattr(response, 'status_code', 'N/A')}, tempo di esecuzione: {execution_time:.2f}s")
                return response
            except Exception as e:
                logger.error(f"Errore in richiesta a {request.path}: {str(e)}")
                raise

        return decorated_function
    return decorator
