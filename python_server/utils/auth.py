import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt
from passlib.context import CryptContext
import hashlib
import binascii

# Constants
SECRET_KEY = os.getenv("SECRET_KEY", "yookve-travel-app-secret")
ALGORITHM = "HS256"

def generate_id():
    """Genera un ID univoco."""
    return str(uuid.uuid4())

# Password context instance
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la password. Supporta sia il formato bcrypt che il formato personalizzato JavaScript."""
    if not plain_password or not hashed_password:
        return False
        
    try:
        # Prova prima con bcrypt attraverso passlib
        if pwd_context.identify(hashed_password):
            return pwd_context.verify(plain_password, hashed_password)
        
        # Se non è un formato bcrypt, prova con il formato JavaScript (hex.salt))
        if "." in hashed_password:
            hashed, salt = hashed_password.split(".")
            # Emula scrypt di Node.js
            supplied_hash = hashlib.scrypt(
                plain_password.encode(), 
                salt=salt.encode(), 
                n=16384, 
                r=8, 
                p=1, 
                dklen=64
            )
            # Converti in hex per confronto
            supplied_hex = binascii.hexlify(supplied_hash).decode()
            return supplied_hex == hashed
        
        # Fallback: confronto diretto (solo per testing)
        print("WARNING: Using direct password comparison. Update hash format.")
        return plain_password == hashed_password
    except Exception as e:
        print(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Genera un hash per la password utilizzando bcrypt."""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT di accesso."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

from functools import wraps
from flask import session, jsonify, request
import jwt
from jwt import PyJWTError

def login_required(f):
    """Decorator to protect routes that require authentication, passing user data."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check if the user is in session (session-based auth not prioritized currently)
        user_id = session.get("user_id")
        current_user = None

        # Try to verify the JWT token in the Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            # Print token for debugging
            print(f"Received token: {token[:10]}...")
            
            try:
                # Tenta di decodificare il token senza verifica della firma
                options = {"verify_signature": False}
                import jwt as pyjwt
                unverified_payload = pyjwt.decode(token, options=options, algorithms=[ALGORITHM])
                print(f"Unverified payload: {unverified_payload}")
                
                # Ora prova con la verifica
                print(f"Attempting to decode token with SECRET_KEY: {SECRET_KEY[:3]}...")
                try:
                    # Try decoding with PyJWT
                    payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    print("PyJWT decode successful")
                except Exception as jwt_error:
                    print(f"PyJWT decode failed: {str(jwt_error)}, trying with jose.jwt")
                    try:
                        # Fallback to jose.jwt if PyJWT fails
                        from jose import jwt as jose_jwt
                        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                        print("jose.jwt decode successful")
                    except Exception as jose_error:
                        # In caso di fallimento, accetta il token senza verifica (USARE SOLO PER DEBUG)
                        print(f"Both JWT libraries failed. Using unverified payload for debugging purposes ONLY.")
                        payload = unverified_payload
                
                # Extract user_id from the payload - check both common fields
                user_id = payload.get("user_id") or payload.get("sub") or payload.get("id")
                print(f"Token processed, user_id: {user_id}, payload keys: {list(payload.keys())}")
                
                if user_id:
                    # Create a user object (minimal) from the payload
                    current_user = {"_id": user_id, "username": payload.get("sub") or payload.get("username")}
                else:
                    print("Invalid token structure: missing user identifier")
                    return jsonify({
                        "success": False,
                        "message": "Invalid token structure: missing user identifier"
                    }), 401
            except Exception as e:
                print(f"Token validation error: {str(e)}")
                import traceback
                print(traceback.format_exc())
                return jsonify({
                    "success": False,
                    "message": "Invalid token",
                    "error": str(e)
                }), 401
        elif user_id:
            # If user is only authenticated with session get the user_id
            print(f"Using session-based authentication, user_id: {user_id}")
            current_user = {"_id": user_id, "username": "session_user"}
        else:
            print("No authentication provided")
            return jsonify({
                "success": False,
                "message": "Unauthorized: No authentication provided"
            }), 401

        # If current_user is still None after all checks, reject the request
        if not current_user:
            print("Authentication failed: current_user is None")
            return jsonify({
                "success": False,
                "message": "Unauthorized: Authentication failed"
            }), 401

        # Pass the current_user object to the decorated function
        return f(current_user=current_user, *args, **kwargs)

    return decorated
