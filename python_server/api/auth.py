from flask import Blueprint, request, jsonify, session
from datetime import timedelta
import uuid

from ..models.repositories import UserRepository
from ..models.models import UserCreate, User, UserLogin, Token
from ..utils.auth import get_password_hash, verify_password, create_access_token
from ..config.settings import JWT_ACCESS_TOKEN_EXPIRES

auth_bp = Blueprint("auth", __name__)
user_repo = UserRepository()

@auth_bp.route("/register", methods=["POST"])
async def register():
    """Registra un nuovo utente."""
    data = request.json
    
    # Verifica se l'utente esiste già
    existing_user = await user_repo.get_by_username(data.get("username"))
    if existing_user:
        return jsonify({"success": False, "message": "Username already exists"}), 400
    
    # Crea un nuovo utente
    user_create = UserCreate(
        username=data.get("username"),
        name=data.get("name"),
        email=data.get("email"),
        password=data.get("password")
    )
    
    # Hash della password
    hashed_password = get_password_hash(user_create.password)
    
    # Salva l'utente
    user = await user_repo.create_user(user_create, hashed_password)
    
    # Crea un token di accesso
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    # Imposta la sessione
    session["user_id"] = user.id
    
    return jsonify({
        "success": True,
        "data": {
            "user": user.dict(),
            "access_token": access_token,
            "token_type": "bearer"
        }
    })

@auth_bp.route("/login", methods=["POST"])
async def login():
    """Effettua il login di un utente."""
    data = request.json
    
    # Verifica le credenziali
    user = await user_repo.get_by_username(data.get("username"))
    if not user or not verify_password(data.get("password"), user.password):
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
    
    # Crea un token di accesso
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    # Imposta la sessione
    session["user_id"] = user.id
    
    # Rimuovi la password dal risultato
    user_data = user.dict(exclude={"password"})
    
    return jsonify({
        "success": True,
        "data": {
            "user": user_data,
            "access_token": access_token,
            "token_type": "bearer"
        }
    })

@auth_bp.route("/logout", methods=["POST"])
async def logout():
    """Effettua il logout di un utente."""
    # Rimuovi la sessione
    session.clear()
    
    return jsonify({
        "success": True,
        "message": "Logout successful"
    })

@auth_bp.route("/user", methods=["GET"])
async def get_current_user():
    """Ottiene l'utente corrente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Not authenticated"}), 401
    
    # Ottieni l'utente
    user = await user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    return jsonify({
        "success": True,
        "data": user
    })