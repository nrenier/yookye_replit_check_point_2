
from flask import Blueprint, jsonify, request, session
import stripe
import logging
from ..config.settings import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from ..models.repositories import get_booking, create_booking, get_bookings_by_user_id, update_booking_status, update_booking_payment_status
from ..models.models import BookingCreate
from ..utils.auth import login_required
from ..middleware import log_request

booking_bp = Blueprint("bookings", __name__)
logger = logging.getLogger(__name__)

# Inizializza Stripe se disponibile
if not STRIPE_SECRET_KEY:
    logger.warning("⚠️ Missing STRIPE_SECRET_KEY. Stripe payment functionality will be unavailable.")
    stripe_client = None
else:
    stripe.api_key = STRIPE_SECRET_KEY
    stripe_client = stripe

@booking_bp.route("/", methods=["GET"])
@login_required
@log_request()
def get_user_bookings():
    """Recupera tutte le prenotazioni dell'utente corrente."""
    user_id = session.get("user_id")
    bookings = get_bookings_by_user_id(user_id)
    return jsonify(bookings)

@booking_bp.route("/<booking_id>", methods=["GET"])
@login_required
@log_request()
def get_booking_by_id(booking_id):
    """Recupera una prenotazione specifica."""
    user_id = session.get("user_id")
    booking = get_booking(booking_id)
    
    if not booking:
        return jsonify({"message": "Prenotazione non trovata"}), 404
    
    # Verifica che l'utente sia il proprietario della prenotazione
    if booking.get("userId") != user_id:
        return jsonify({"message": "Non autorizzato"}), 403
    
    return jsonify(booking)

@booking_bp.route("/", methods=["POST"])
@login_required
@log_request()
def create_new_booking():
    """Crea una nuova prenotazione."""
    user_id = session.get("user_id")
    data = request.json
    
    # Aggiungi i campi richiesti
    data["userId"] = user_id
    data["status"] = "pending"
    data["paymentStatus"] = "unpaid"
    
    try:
        booking_data = BookingCreate(**data)
        booking = create_booking(booking_data.dict())
        return jsonify(booking), 201
    except Exception as e:
        logger.error(f"Errore nella creazione della prenotazione: {str(e)}")
        return jsonify({"message": f"Errore nella creazione della prenotazione: {str(e)}"}), 400

@booking_bp.route("/<booking_id>/status", methods=["PATCH"])
@login_required
@log_request()
def update_booking_status_route(booking_id):
    """Aggiorna lo stato di una prenotazione."""
    user_id = session.get("user_id")
    data = request.json
    status = data.get("status")
    
    if not status or status not in ["pending", "confirmed", "cancelled"]:
        return jsonify({"message": "Stato non valido"}), 400
    
    booking = get_booking(booking_id)
    
    if not booking:
        return jsonify({"message": "Prenotazione non trovata"}), 404
    
    # Verifica che l'utente sia il proprietario della prenotazione
    if booking.get("userId") != user_id:
        return jsonify({"message": "Non autorizzato"}), 403
    
    updated_booking = update_booking_status(booking_id, status)
    return jsonify(updated_booking)

def create_payment_intent_handler():
    """Crea un intent di pagamento con Stripe."""
    if not stripe_client:
        return jsonify({"message": "Servizio di pagamento non disponibile"}), 503
    
    if "user_id" not in session:
        return jsonify({"message": "Non autenticato"}), 401
    
    user_id = session.get("user_id")
    data = request.json
    booking_id = data.get("bookingId")
    
    if not booking_id:
        return jsonify({"message": "ID prenotazione mancante"}), 400
    
    booking = get_booking(booking_id)
    
    if not booking:
        return jsonify({"message": "Prenotazione non trovata"}), 404
    
    # Verifica che l'utente sia il proprietario della prenotazione
    if booking.get("userId") != user_id:
        return jsonify({"message": "Non autorizzato"}), 403
    
    try:
        # Crea il payment intent con Stripe
        payment_intent = stripe_client.PaymentIntent.create(
            amount=int(booking.get("totalPrice", 0) * 100),  # Converti in centesimi
            currency="eur",
            metadata={
                "bookingId": str(booking_id),
                "userId": str(user_id)
            }
        )
        
        return jsonify({
            "clientSecret": payment_intent.client_secret
        })
    except Exception as e:
        return jsonify({"message": f"Errore nella creazione dell'intento di pagamento: {str(e)}"}), 500

def webhook_handler():
    """Gestisce i webhook di Stripe."""
    if not stripe_client:
        return jsonify({"message": "Servizio di pagamento non disponibile"}), 503
    
    try:
        event = request.json
        
        # Gestisci gli eventi di pagamento
        if event.get("type") == 'payment_intent.succeeded':
            payment_intent = event.get("data", {}).get("object", {})
            booking_id = payment_intent.get("metadata", {}).get("bookingId")
            
            # Aggiorna lo stato di pagamento della prenotazione
            if booking_id:
                update_booking_payment_status(booking_id, "paid")
                update_booking_status(booking_id, "confirmed")
        
        return jsonify({"received": True})
    except Exception as e:
        logger.error(f'Webhook error: {str(e)}')
        return jsonify({"message": f"Webhook error: {str(e)}"}), 400
