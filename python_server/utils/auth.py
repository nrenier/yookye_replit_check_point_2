from datetime import datetime, timedelta
from typing import Optional
import uuid
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer

from ..models.models import TokenData, User, UserInDB
from ..config.settings import JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    """Verifica la password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Ottiene l'hash della password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token di accesso JWT."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm="HS256")
    
    return encoded_jwt

def decode_token(token: str):
    """Decodifica un token JWT."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

def generate_id():
    """Genera un ID univoco."""
    return str(uuid.uuid4())