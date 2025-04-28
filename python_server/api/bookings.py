from flask import Blueprint, request, jsonify, session
from typing import Optional
import stripe

from ..models.repositories import BookingRepository, TravelPackageRepository
from ..models.models import BookingCreate, BookingUpdate
from ..config.settings import STRIPE_SECRET_KEY

booking_bp = Blueprint("bookings", __name__)
booking_repo = BookingRepository()
travel_repo = TravelPackageRepository()

# Inizializza Stripe se la chiave è disponibile
stripe_client = None
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
    stripe_client = stripe
else:
    print("⚠️ Missing STRIPE_SECRET_KEY. Stripe payment functionality will be unavailable.")

@booking_bp.route("", methods=["GET"])
async def get_bookings():
    """Ottiene le prenotazioni dell'utente corrente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Ottieni le prenotazioni
    bookings = await booking_repo.get_by_user_id(user_id)
    return jsonify(bookings)

@booking_bp.route("/<id>", methods=["GET"])
async def get_booking(id):
    """Ottiene una prenotazione per ID."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Ottieni la prenotazione
    booking = await booking_repo.get_by_id(id)
    
    # Verifica che l'utente sia il proprietario della prenotazione
    if not booking or booking.userId != user_id:
        return jsonify({"success": False, "message": "Prenotazione non trovata o non autorizzata"}), 404
    
    return jsonify(booking)

@booking_bp.route("", methods=["POST"])
async def create_booking():
    """Crea una nuova prenotazione."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        data = request.json
        data["userId"] = user_id
        data["status"] = "pending"
        data["paymentStatus"] = "unpaid"
        
        # Crea la prenotazione
        booking_create = BookingCreate(**data)
        booking = await booking_repo.create(booking_create)
        
        return jsonify(booking), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@booking_bp.route("/<id>/status", methods=["PATCH"])
async def update_booking_status(id):
    """Aggiorna lo stato di una prenotazione."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        data = request.json
        status = data.get("status")
        
        if not status or status not in ["pending", "confirmed", "cancelled"]:
            return jsonify({"success": False, "message": "Stato non valido"}), 400
        
        # Ottieni la prenotazione
        booking = await booking_repo.get_by_id(id)
        
        # Verifica che l'utente sia il proprietario della prenotazione
        if not booking or booking.userId != user_id:
            return jsonify({"success": False, "message": "Prenotazione non trovata o non autorizzata"}), 404
        
        # Aggiorna lo stato
        updated_booking = await booking_repo.update_status(id, status)
        
        return jsonify(updated_booking)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@booking_bp.route("/create-payment-intent", methods=["POST"])
async def create_payment_intent():
    """Crea un intento di pagamento per Stripe."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Verifica che Stripe sia disponibile
    if not stripe_client:
        return jsonify({"success": False, "message": "Servizio di pagamento non disponibile"}), 503
    
    try:
        data = request.json
        booking_id = data.get("bookingId")
        
        if not booking_id:
            return jsonify({"success": False, "message": "ID prenotazione mancante"}), 400
        
        # Ottieni la prenotazione
        booking = await booking_repo.get_by_id(booking_id)
        
        # Verifica che l'utente sia il proprietario della prenotazione
        if not booking or booking.userId != user_id:
            return jsonify({"success": False, "message": "Prenotazione non trovata o non autorizzata"}), 404
        
        # Crea l'intento di pagamento
        payment_intent = stripe_client.PaymentIntent.create(
            amount=booking.totalPrice * 100,  # Converti in centesimi
            currency="eur",
            metadata={
                "bookingId": booking_id,
                "userId": user_id
            }
        )
        
        return jsonify({
            "success": True,
            "clientSecret": payment_intent.client_secret
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Errore nella creazione dell'intento di pagamento: {str(e)}"}), 500

@booking_bp.route("/webhook", methods=["POST"])
async def stripe_webhook():
    """Webhook per gestire gli eventi di pagamento da Stripe."""
    # Verifica che Stripe sia disponibile
    if not stripe_client:
        return jsonify({"success": False, "message": "Servizio di pagamento non disponibile"}), 503
    
    try:
        # Per semplicità, usa direttamente il payload
        event = request.json
        
        # Gestisci gli eventi di pagamento
        if event.get("type") == "payment_intent.succeeded":
            payment_intent = event.get("data", {}).get("object", {})
            booking_id = payment_intent.get("metadata", {}).get("bookingId")
            
            # Aggiorna lo stato di pagamento della prenotazione
            if booking_id:
                await booking_repo.update_payment_status(booking_id, "paid")
                await booking_repo.update_status(booking_id, "confirmed")
        
        return jsonify({"success": True, "received": True})
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return jsonify({"success": False, "message": f"Webhook error: {str(e)}"}), 400