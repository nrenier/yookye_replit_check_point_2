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
            start_time = time.time()
            logger.info(f"Richiesta a {request.path} con metodo {request.method}")

            response = f(*args, **kwargs)

            # Verifica se la risposta è un coroutine (async)
            if hasattr(response, '__await__'):
                # Per funzioni asincrone, dobbiamo modificare l'implementazione
                @wraps(f)
                async def async_wrapper(*args, **kwargs):
                    start_time = time.time()
                    try:
                        # Attendere il risultato del coroutine
                        response = await f(*args, **kwargs)
                        end_time = time.time()
                        execution_time = end_time - start_time
                        logger.info(f"Risposta asincrona da {request.path}: {getattr(response, 'status_code', 'N/A')}, tempo di esecuzione: {execution_time:.2f}s")
                        return response
                    except Exception as e:
                        logger.error(f"Errore in richiesta asincrona a {request.path}: {str(e)}")
                        raise
                return async_wrapper(*args, **kwargs)
            else:
                # Per funzioni sincrone, usa l'implementazione originale
                end_time = time.time()
                execution_time = end_time - start_time
                logger.info(f"Risposta da {request.path}: {getattr(response, 'status_code', 'N/A')}, tempo di esecuzione: {execution_time:.2f}s")
                return response

        return decorated_function
    return decorator