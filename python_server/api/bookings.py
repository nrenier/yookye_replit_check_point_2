from flask import Blueprint, jsonify, request, session
import stripe
import logging
from ..config.settings import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from ..models.repositories import BookingRepository
from ..models.models import BookingCreate, Booking
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
async def get_user_bookings(current_user):
    """Recupera tutte le prenotazioni dell'utente corrente."""
    try:
        user_id = session.get("user_id")
        booking_repo = BookingRepository()
        bookings = await booking_repo.get_by_user_id(user_id)
        if isinstance(bookings, list):
            return jsonify([booking.dict() for booking in bookings])
        return jsonify([])
    except Exception as e:
        logger.error(f"Errore nel recupero delle prenotazioni: {str(e)}")
        return jsonify({"message": f"Errore nel recupero delle prenotazioni: {str(e)}"}), 500

@booking_bp.route("/<booking_id>", methods=["GET"])
@login_required
@log_request()
def get_booking_by_id(booking_id, current_user):
    """Recupera una prenotazione specifica."""
    try:
        user_id = session.get("user_id")
        booking_repo = BookingRepository()
        
        # Creiamo una funzione asincrona interna per gestire l'operazione async
        async def fetch_booking():
            try:
                booking = await booking_repo.get_by_id(booking_id)
                
                if not booking:
                    return jsonify({"message": "Prenotazione non trovata"}), 404
                
                # Verifica che l'utente sia il proprietario della prenotazione
                if booking.userId != user_id:
                    return jsonify({"message": "Non autorizzato"}), 403
                
                return jsonify(booking.dict())
            except Exception as e:
                logger.error(f"Errore nel recupero della prenotazione {booking_id}: {str(e)}")
                return jsonify({"message": f"Errore nel recupero della prenotazione: {str(e)}"}), 500
        
        # Eseguiamo la funzione asincrona e restituiamo il risultato
        import asyncio
        return asyncio.run(fetch_booking())
    except Exception as e:
        logger.error(f"Errore nel recupero della prenotazione {booking_id}: {str(e)}")
        return jsonify({"message": f"Errore nel recupero della prenotazione: {str(e)}"}), 500

@booking_bp.route("/", methods=["POST"])
@login_required
@log_request()
async def create_new_booking(current_user):
    """Crea una nuova prenotazione."""
    user_id = session.get("user_id")
    data = request.json
    
    # Aggiungi i campi richiesti
    data["userId"] = user_id
    data["status"] = "pending"
    data["paymentStatus"] = "unpaid"
    
    try:
        booking_data = BookingCreate(**data)
        booking_repo = BookingRepository()
        booking = await booking_repo.create(booking_data)
        return jsonify(booking.dict()), 201
    except Exception as e:
        logger.error(f"Errore nella creazione della prenotazione: {str(e)}")
        return jsonify({"message": f"Errore nella creazione della prenotazione: {str(e)}"}), 400

@booking_bp.route("/<booking_id>/status", methods=["PATCH"])
@login_required
@log_request()
async def update_booking_status_route(booking_id, current_user):
    """Aggiorna lo stato di una prenotazione."""
    user_id = session.get("user_id")
    data = request.json
    status = data.get("status")
    
    if not status or status not in ["pending", "confirmed", "cancelled"]:
        return jsonify({"message": "Stato non valido"}), 400
    
    booking_repo = BookingRepository()
    booking = await booking_repo.get_by_id(booking_id)
    
    if not booking:
        return jsonify({"message": "Prenotazione non trovata"}), 404
    
    # Verifica che l'utente sia il proprietario della prenotazione
    if booking.userId != user_id:
        return jsonify({"message": "Non autorizzato"}), 403
    
    updated_booking = await booking_repo.update_status(booking_id, status)
    return jsonify(updated_booking.dict())

@booking_bp.route("/create-payment-intent", methods=["POST"])
@login_required
@log_request()
async def create_payment_intent_handler(current_user):
    """Crea un intento di pagamento con Stripe."""
    if not stripe_client:
        return jsonify({"message": "Servizio di pagamento non disponibile"}), 503
    
    user_id = session.get("user_id")
    data = request.json
    booking_id = data.get("bookingId")
    
    if not booking_id:
        return jsonify({"message": "ID prenotazione mancante"}), 400
    
    booking_repo = BookingRepository()
    booking = await booking_repo.get_by_id(booking_id)
    
    if not booking:
        return jsonify({"message": "Prenotazione non trovata"}), 404
    
    # Verifica che l'utente sia il proprietario della prenotazione
    if booking.userId != user_id:
        return jsonify({"message": "Non autorizzato"}), 403
    
    try:
        # Crea il payment intent con Stripe
        payment_intent = stripe_client.PaymentIntent.create(
            amount=int(booking.totalPrice * 100),  # Converti in centesimi
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

@booking_bp.route("/webhook", methods=["POST"])
async def webhook_handler():
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
                booking_repo = BookingRepository()
                await booking_repo.update_payment_status(booking_id, "paid")
                await booking_repo.update_status(booking_id, "confirmed")
        
        return jsonify({"received": True})
    except Exception as e:
        logger.error(f'Webhook error: {str(e)}')
        return jsonify({"message": f"Webhook error: {str(e)}"}), 400
