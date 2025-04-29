
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
        
        # Se non è un formato bcrypt, prova con il formato JavaScript (hex.salt)
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
