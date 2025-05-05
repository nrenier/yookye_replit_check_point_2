from flask import Blueprint, request, jsonify, session
from datetime import timedelta
import uuid

from ..models.repositories import UserRepository
from ..models.models import UserCreate, User, UserLogin, Token
from ..utils.auth import get_password_hash, verify_password, create_access_token
from ..config.settings import JWT_ACCESS_TOKEN_EXPIRES, SECRET_KEY #Import SECRET_KEY

auth_bp = Blueprint("auth", __name__)
user_repo = UserRepository()

@auth_bp.route("/register", methods=["POST"])
@auth_bp.route("/api/register", methods=["POST"])
def register():
    """Registra un nuovo utente."""
    data = request.json

    # Verifica se l'utente esiste già
    existing_user = user_repo.get_by_username(data.get("username"))
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
    user = user_repo.create_user(user_create, hashed_password)

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
@auth_bp.route("/api/login", methods=["POST"])
def login():
    """Effettua il login di un utente."""
    data = request.json
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    username = data.get("username")
    password = data.get("password")

    print(f"Login attempt for user: {username}")

    if not username or not password:
        return jsonify({"success": False, "message": "Invalid username or password"}), 400

    # Verifica le credenziali
    user = user_repo.get_by_username(username)

    # Se l'utente non esiste
    if not user:
        print(f"User not found: {username}")
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

    print(f"User found: {user.username}, checking password")

    # Verifica la password
    password_valid = False
    try:
        password_valid = verify_password(password, user.password)
        if not password_valid:
            print(f"Password mismatch for user: {username}")
            return jsonify({"success": False, "message": "Invalid username or password"}), 401
    except Exception as e:
        print(f"Errore nella verifica della password: {str(e)}")
        return jsonify({"success": False, "message": "Authentication error"}), 500

    print(f"Password valid for user: {username}, generating token")

    # Crea un token di accesso
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )

    # Imposta la sessione
    session["user_id"] = user.id
    print(f"Session set for user_id: {user.id}")

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
@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    """Effettua il logout di un utente."""
    # Rimuovi la sessione
    session.clear()

    return jsonify({
        "success": True,
        "message": "Logout successful"
    })

@auth_bp.route("/user", methods=["GET"])
@auth_bp.route("/api/user", methods=["GET"])
@auth_bp.route("/api/me", methods=["GET"])
def get_current_user():
    """Ottiene l'utente corrente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Not authenticated"}), 401

@auth_bp.route("/test-auth", methods=["GET"])
@auth_bp.route("/api/test-auth", methods=["GET"])
@login_required
def test_auth(current_user):
    """Test endpoint to verify authentication is working."""
    return jsonify({
        "success": True,
        "message": "Authentication working correctly",
        "user": current_user
    })


    # Ottieni l'utente
    user = user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Converti l'oggetto User in un dizionario per la serializzazione JSON
    user_dict = {
        "id": user.id,
        "username": user.username if hasattr(user, 'username') else "",
        "email": user.email if hasattr(user, 'email') else "",
        "name": user.name if hasattr(user, 'name') else "",
        "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None
    }

    return jsonify({
        "success": True,
        "user": user_dict
    })