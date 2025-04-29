from flask import Blueprint, request, jsonify, session

from ..models.repositories import PreferenceRepository
from ..models.models import PreferenceCreate
from ..utils.travel_api_client import TravelApiClient

pref_bp = Blueprint("preferences", __name__)
pref_repo = PreferenceRepository()

travel_api_client = TravelApiClient()

@pref_bp.route("", methods=["GET"])
async def get_preferences():
    """Ottiene le preferenze dell'utente corrente."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    # Ottieni le preferenze
    preferences = await pref_repo.get_by_user_id(user_id)
    return jsonify(preferences)

@pref_bp.route("", methods=["POST"])
async def create_preference():
    """Crea una nuova preferenza e ottiene raccomandazioni dall'API esterna."""
    # Verifica la sessione
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Non autenticato"}), 401
    
    try:
        data = request.json
        
        # Aggiunge l'ID utente ai dati
        # Se la struttura è nel nuovo formato, adattiamo i dati per il DB locale
        user_data = {"userId": user_id}
        
        # Converti il nuovo formato in un formato compatibile con il modello locale
        if "interessi" in data:
            # Mappa il nuovo formato al vecchio formato per compatibilità
            user_data.update({
                "userId": user_id,
                "passioni": extract_interests(data["interessi"]),
                "luoghiDaNonPerdere": "si" if data.get("luoghi_da_non_perdere", {}).get("luoghi_specifici", False) else "no",
                "luoghiSpecifici": [data.get("luoghi_da_non_perdere", {}).get("city", "")] if data.get("luoghi_da_non_perdere", {}).get("luoghi_specifici", False) else [],
                "tipoDestinazioni": extract_destinations(data.get("mete_clou", {})),
                "ritmoViaggio": extract_rhythm(data.get("ritmo_ideale", {})),
                "livelloSistemazione": extract_accommodation_level(data.get("sistemazione", {}).get("livello", {})),
                "tipologiaSistemazione": extract_accommodation_types(data.get("sistemazione", {}).get("tipologia", {})),
                "numAdulti": str(data.get("viaggiatori", {}).get("adults_number", 2)),
                "numBambini": str(data.get("viaggiatori", {}).get("children_number", 0)),
                "numNeonati": str(data.get("viaggiatori", {}).get("baby_number", 0)),
                "numCamere": str(data.get("viaggiatori", {}).get("Room_number", 1)),
                "tipologiaViaggiatore": extract_traveler_type(data.get("tipologia_viaggiatore", {})),
                "budget": extract_budget(data.get("budget_per_persona_giorno", {})),
                "noteAggiuntive": data.get("esigenze_particolari", "")
            })
        else:
            # Il formato è già quello vecchio, aggiungiamo solo l'ID utente
            user_data.update(data)
        
        # Invia le preferenze all'API esterna nel formato originale ricevuto
        external_pref_response = travel_api_client.send_preferences(data)
        if external_pref_response is None:
            return jsonify({"success": False, "message": "Errore nell'invio delle preferenze all'API esterna"}), 500

        # Ottieni raccomandazioni dall'API esterna
        recommendations = travel_api_client.get_recommendations()
        if recommendations is None:
            return jsonify({"success": False, "message": "Errore nell'ottenere raccomandazioni dall'API esterna"}), 500

        return jsonify(recommendations), 200
    except Exception as e:
        import traceback
        print(f"Errore nel creare preferenze: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "message": str(e)}), 400


def extract_interests(interessi):
    """Estrae gli interessi dal nuovo formato."""
    result = []
    
    # Estrai dalle categorie principali
    if interessi.get("storia_e_arte", {}).get("musei_e_gallerie"):
        result.append("musei")
    if interessi.get("storia_e_arte", {}).get("monumenti_e_architettura"):
        result.append("monumenti")
    if any(interessi.get("Food_&_wine", {}).values()):
        result.append("enogastronomia")
    if any(interessi.get("vacanze_attive", {}).values()):
        result.append("sport")
    if interessi.get("vita_locale"):
        result.append("cultura")
    if interessi.get("salute_e_benessere"):
        result.append("benessere")
    
    return result

def extract_destinations(mete_clou):
    """Estrai il tipo di destinazione."""
    if mete_clou.get("entrambe"):
        return "entrambi"
    if mete_clou.get("destinazioni_popolari"):
        return "popolari"
    if mete_clou.get("destinazioni_avventura"):
        return "avventura"
    return "entrambi"  # default

def extract_rhythm(ritmo):
    """Estrai il ritmo del viaggio."""
    if ritmo.get("veloce"):
        return "veloce"
    if ritmo.get("moderato"):
        return "moderato"
    if ritmo.get("rilassato"):
        return "rilassato"
    return "moderato"  # default

def extract_accommodation_level(livello):
    """Estrai il livello della sistemazione."""
    if livello.get("fascia_media"):
        return "standard"
    if livello.get("boutique"):
        return "boutique"
    if livello.get("eleganti"):
        return "lusso"
    return "boutique"  # default

def extract_accommodation_types(tipologia):
    """Estrai i tipi di sistemazione."""
    result = []
    mapping = {
        "hotel": "hotel",
        "b&b": "bb",
        "agriturismo": "agriturismo",
        "villa": "villa",
        "appartamento": "appartamento",
        "glamping": "glamping"
    }
    
    for key, value in tipologia.items():
        if value and key in mapping:
            result.append(mapping[key])
    
    return result

def extract_traveler_type(tipologia):
    """Estrai il tipo di viaggiatore."""
    if tipologia.get("famiglia"):
        return "famiglia"
    if tipologia.get("coppia"):
        return "coppia"
    if tipologia.get("gruppo_amici"):
        return "amici"
    if tipologia.get("azienda"):
        return "business"
    return "coppia"  # default

def extract_budget(budget):
    """Estrai il budget."""
    if budget.get("economico"):
        return "budget"
    if budget.get("fascia_media"):
        return "mid_range"
    if budget.get("comfort"):
        return "comfort"
    if budget.get("lusso"):
        return "luxury"
    if budget.get("nessun_budget"):
        return "no_limit"
    return "mid_range"  # default
