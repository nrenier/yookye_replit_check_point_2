from elasticsearch import Elasticsearch
from .settings import (
    OPENSEARCH_HOST, 
    OPENSEARCH_PORT, 
    OPENSEARCH_USERNAME, 
    OPENSEARCH_PASSWORD,
    OPENSEARCH_USE_SSL,
    OPENSEARCH_VERIFY_CERTS,
    MAPPINGS,
    INDEX_USERS,
    INDEX_PREFERENCES,
    INDEX_TRAVEL_PACKAGES,
    INDEX_BOOKINGS
)
import logging

logger = logging.getLogger(__name__)

def get_opensearch_client():
    """Crea e restituisce un client Elasticsearch."""
    auth = None
    if OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD:
        auth = (OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD)
        
    client = Elasticsearch(
        hosts=[f"http{'s' if OPENSEARCH_USE_SSL else ''}://{OPENSEARCH_HOST}:{OPENSEARCH_PORT}"],
        basic_auth=auth,
        verify_certs=OPENSEARCH_VERIFY_CERTS,
        ssl_show_warn=False
    )
    return client

def init_indices():
    """Inizializza gli indici di OpenSearch se non esistono già."""
    client = get_opensearch_client()
    
    # Crea indici con mappings se non esistono
    for index_name, mapping in MAPPINGS.items():
        try:
            # Verifica se l'indice esiste
            if not client.indices.exists(index=index_name):
                # Crea l'indice con il mapping specificato
                client.indices.create(index=index_name, body=mapping)
                logger.info(f"Indice '{index_name}' creato con successo")
            else:
                logger.info(f"Indice '{index_name}' esiste già")
        except Exception as e:
            logger.error(f"Errore nella creazione dell'indice '{index_name}': {str(e)}")

def seed_travel_packages():
    """Seed dei pacchetti di viaggio demo se non ci sono dati."""
    client = get_opensearch_client()
    
    # Verifica se ci sono già pacchetti di viaggio
    result = client.count(index=INDEX_TRAVEL_PACKAGES)
    count = result.get('count', 0)
    
    if count > 0:
        logger.info(f"I pacchetti di viaggio esistono già ({count}). Skip seeding.")
        return
    
    # Inserisci dati di esempio
    packages = [
        {
            "id": "1",
            "title": "Weekend Culturale a Roma",
            "description": "Un weekend alla scoperta della città eterna",
            "destination": "Roma",
            "imageUrl": "https://images.unsplash.com/photo-1499678329028-101435549a4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
            "rating": "4.5",
            "reviewCount": 120,
            "accommodationName": "Hotel Artemide 4★",
            "accommodationType": "Hotel",
            "transportType": "Volo A/R da Milano",
            "durationDays": 3,
            "durationNights": 2,
            "experiences": [
                "Visita guidata ai Musei Vaticani",
                "Tour gastronomico di Trastevere",
                "Biglietti salta-fila per il Colosseo"
            ],
            "price": 650,
            "isRecommended": True,
            "categories": ["Storia e Arte", "Enogastronomia", "Vita Locale"]
        },
        {
            "id": "2",
            "title": "Relax e Cultura in Toscana",
            "description": "Un soggiorno rilassante immersi nella campagna toscana",
            "destination": "Toscana",
            "imageUrl": "https://images.unsplash.com/photo-1534445867742-43195f401b6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
            "rating": "4.0",
            "reviewCount": 98,
            "accommodationName": "Agriturismo Il Poggio",
            "accommodationType": "Agriturismo",
            "transportType": "Auto a noleggio",
            "durationDays": 5,
            "durationNights": 4,
            "experiences": [
                "Degustazione vini a Montalcino",
                "Visita guidata di Siena",
                "Corso di cucina toscana"
            ],
            "price": 780,
            "isRecommended": False,
            "categories": ["Enogastronomia", "Salute e Benessere", "Vita Locale"]
        },
        {
            "id": "3",
            "title": "Mare e Cultura in Costiera",
            "description": "Un viaggio alla scoperta della costiera amalfitana",
            "destination": "Costiera Amalfitana",
            "imageUrl": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
            "rating": "4.8",
            "reviewCount": 156,
            "accommodationName": "Hotel Belvedere 4★",
            "accommodationType": "Hotel",
            "transportType": "Treno A/R da Roma",
            "durationDays": 6,
            "durationNights": 5,
            "experiences": [
                "Tour in barca di Capri",
                "Visita agli scavi di Pompei",
                "Lezione di cucina napoletana"
            ],
            "price": 950,
            "isRecommended": False,
            "categories": ["Storia e Arte", "Enogastronomia", "Vita Locale"]
        },
        {
            "id": "4",
            "title": "Avventura nelle Dolomiti",
            "description": "Un'esperienza indimenticabile immersi nella natura",
            "destination": "Dolomiti",
            "imageUrl": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
            "rating": "4.7",
            "reviewCount": 89,
            "accommodationName": "Mountain Lodge",
            "accommodationType": "Rifugio",
            "transportType": "Auto propria",
            "durationDays": 4,
            "durationNights": 3,
            "experiences": [
                "Escursione guidata sul Monte Cristallo",
                "Mountain bike nei sentieri alpini",
                "Corso base di arrampicata"
            ],
            "price": 580,
            "isRecommended": False,
            "categories": ["Sport", "Salute e Benessere"]
        },
        {
            "id": "5",
            "title": "Benessere in Umbria",
            "description": "Relax e natura nel cuore verde d'Italia",
            "destination": "Umbria",
            "imageUrl": "https://images.unsplash.com/photo-1531816458010-fb7685eecbcb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
            "rating": "4.6",
            "reviewCount": 102,
            "accommodationName": "Borgo Spa Resort",
            "accommodationType": "Resort",
            "transportType": "Auto a noleggio",
            "durationDays": 5,
            "durationNights": 4,
            "experiences": [
                "Percorso benessere con massaggio",
                "Yoga all'alba tra gli ulivi",
                "Escursione nei borghi medievali"
            ],
            "price": 870,
            "isRecommended": True,
            "categories": ["Salute e Benessere", "Vita Locale"]
        },
        {
            "id": "6",
            "title": "Food Tour in Emilia Romagna",
            "description": "Un percorso gastronomico nella patria del gusto italiano",
            "destination": "Emilia Romagna",
            "imageUrl": "https://images.unsplash.com/photo-1528795259021-d8c86e14354c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
            "rating": "4.9",
            "reviewCount": 135,
            "accommodationName": "Palazzo del Gusto",
            "accommodationType": "B&B",
            "transportType": "Treno A/R da Milano",
            "durationDays": 4,
            "durationNights": 3,
            "experiences": [
                "Visita a un caseificio di Parmigiano Reggiano",
                "Corso di pasta fresca fatta in casa",
                "Tour con degustazione in acetaia tradizionale"
            ],
            "price": 720,
            "isRecommended": True,
            "categories": ["Enogastronomia", "Vita Locale"]
        }
    ]
    
    # Bulk insert
    bulk_data = []
    for package in packages:
        # Manipolazione delle esperienze per convertirle in stringa (se necessario)
        if 'experiences' in package and isinstance(package['experiences'], list):
            package['experiences'] = '\n'.join(package['experiences'])
            
        # Aggiungi l'operazione di indicizzazione
        bulk_data.append({"index": {"_index": INDEX_TRAVEL_PACKAGES, "_id": package['id']}})
        bulk_data.append(package)
    
    if bulk_data:
        client.bulk(body=bulk_data, refresh=True)
        logger.info(f"Seed di {len(packages)} pacchetti di viaggio completato con successo")