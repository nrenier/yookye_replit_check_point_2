import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import TravelCard from "@/components/travel-card";
import CityExperiencePackage, { CityPackageData } from "@/components/city-experience-package";
import { TravelPackage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ResultsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("packages");
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  // Estrai il job_id dalla query string, se presente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobIdParam = params.get("job_id");
    if (jobIdParam) {
      setJobId(jobIdParam);
    }
  }, []);

  const { data: recommendations, isLoading: packagesLoading, error: packagesError, refetch } = useQuery<any>({
    queryKey: ["/api/recommendations", jobId],
    queryFn: async () => {
      const endpoint = jobId ? `/api/recommendations?job_id=${jobId}` : "/api/recommendations";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Errore durante il recupero dei dati");
      }
      return response.json();
    },
  });

  const { data: cityPackages, isLoading: cityPackagesLoading, error: cityPackagesError } = useQuery<CityPackageData>({
    queryKey: ["/api/recommendations/city-packages"],
    // If the API endpoint doesn't exist yet, we can use a mock implementation
    // This will be replaced with the real API once it's implemented
    queryFn: async () => {
      // Mocking the response for demonstration
      // In a real implementation, this would be fetched from your API
      return {
        accomodation: {
          "Roma": [
            {
              "hid": 7478033,
              "name": "Precise House Mantegna Roma",
              "address": "A.Mantegna, 130, Roma",
              "phone": "+39 06989521",
              "kind": "Hotel",
              "latitude": 41.853,
              "longitude": 12.496451,
              "star_rating": 4,
              "email": "reservation.room@precisehotels.com",
              "description": "«Precise House Mantegna Roma» Devi avere il massimo del comfort in vacanza! Scegli hotel a Roma. L'hotel si trova a 5 km dal centro città...",
              "id": "barcelo_aran_mantegna",
              "daily_prices": 141.71,
              "meal": "nomeal",
              "room_name": "Camera doppia Superior (letto matrimoniale)"
            },
            {
              "hid": 7476190,
              "name": "BV Oly Hotel",
              "address": "Via Santuario Regina degli Apostoli,36, Roma",
              "phone": "393906594441",
              "kind": "Hotel",
              "latitude": 41.85173,
              "longitude": 12.482609,
              "star_rating": 4,
              "email": "booking@bvolyhotel.com",
              "description": "«BV Oly Hotel» Ottima scelta se vuoi rilassarti in hotel tanto quanto esplorare la città a piedi. Scegli hotel ra Roma...",
              "id": "oly",
              "daily_prices": 135.26,
              "meal": "breakfast",
              "room_name": "Camera doppia Classica (2 letti singoli)"
            }
          ],
          "Firenze": [
            {
              "hid": 7500769,
              "name": "Hotel Alinari",
              "address": "Largo Alinari 15, Firenze",
              "phone": "39055284289",
              "kind": "Hotel",
              "latitude": 43.77629,
              "longitude": 11.250681,
              "star_rating": 3,
              "email": "info@hotelalinari.com",
              "description": "La struttura a Il luogo ideale per rilassarsi dopo una giornata piena di emozioni! Hotel \"Hotel Alinari\" si trova a Firenze...",
              "id": "hotel_alinari_2",
              "daily_prices": 169.0,
              "meal": "nomeal",
              "room_name": "Camera doppia (2 letti singoli)"
            }
          ]
        },
        esperienze: {
          "Roma": [
            {
              "url": [
                "https://yookye.com/it/proposte/degustazione-esclusiva-di-vini-tipici-italiani"
              ],
              "alias": [
                "Degustazione Esclusiva di Vini tipici Italiani"
              ],
              "stato": [
                "Attiva"
              ],
              "provincia": [
                "Roma"
              ],
              "citta": [
                "Roma"
              ],
              "descrizione": "Vivi una degustazione esclusiva nel centro storico di Roma! Gusterai 6 tipologie di vini Italiani con assaggio di formaggi e olive...",
              "dettagli": {
                "dettagli_aggiuntivi": "durata_dell'esperienza: 2 ore",
                "tipo_attivita": "Cultura",
                "scenario": "Città",
                "stagione": [
                  "Autunno",
                  "Estate",
                  "Inverno",
                  "Primavera"
                ],
                "durata": "1 day",
                "target": [
                  "Coppia",
                  "Gruppo",
                  "Individuale"
                ]
              },
              "tags": [
                "Coppia",
                "Gruppo",
                "Individuale",
                "1 day",
                "Cultura",
                "Città",
                "Roma"
              ],
              "dati_extra": "mappa: Roma Italia",
              "tipologia": "visite_alle_cantine, corsi_di_cucina"
            }
          ],
          "Firenze": [
            {
              "url": [
                "https://yookye.com/it/proposte/tour-nel-chianti-vespa-con-pasto-km0-e-degustazioni"
              ],
              "alias": [
                "Tour nel Chianti in Vespa con Pasto Km0 e Degustazioni"
              ],
              "stato": [
                "Attiva"
              ],
              "provincia": [
                "Firenze"
              ],
              "citta": [
                "Firenze"
              ],
              "descrizione": "In pochissimo tempo il nostro minibus vi porterà in un luogo meraviglioso, dove aria fresca, panorami mozzafiato...",
              "tags": [
                "Azienda",
                "Coppia",
                "Famiglia",
                "Gruppo",
                "Individuale",
                "1 day",
                "Accompagnatore",
                "Fotografia",
                "Noleggi",
                "Vespa",
                "Collina",
                "Firenze",
                "Chi siamo"
              ],
              "dati_extra": "servizisinclusi: {'siaconsiglia': 'di indossare scarpe comode.', 'nonsicuriguida': 'Nel caso in cui non vi sentiate sicuri nel guidare da soli potrete avere la possibilità di essere affiancati durante la passeggiata da uno dei nostri esperti accompagnatori.'} | mappa: Firenze Italia",
              "dettagli": {
                "scenario": "Collina",
                "stagione": "Autunno Estate Inverno Primavera",
                "durata": "1 day",
                "difficolta": "Facile",
                "target": "Azienda Coppia Famiglia Gruppo Individuale",
                "dettagli_aggiuntivi": "tipodattività: Accompagnatore Fotografia Noleggi Vespa"
              },
              "tipologia": "visite_alle_cantine, vita_locale, soggiorni_nella_wine_country"
            }
          ]
        }
      };
    }
  });

  const isLoading = packagesLoading || cityPackagesLoading;
  const error = packagesError || cityPackagesError;

  // Gestisci il polling per job non ancora completati
  useEffect(() => {
    // Se abbiamo una risposta con status diverso da SUCCESS, iniziamo il polling
    if (recommendations && recommendations.status && recommendations.status !== "SUCCESS") {
      // Se non abbiamo già iniziato il polling
      if (!pollingInterval) {
        console.log("Inizia il polling per il job", recommendations.job_id);
        // Salva il job_id dalla risposta se disponibile
        if (recommendations.job_id && !jobId) {
          setJobId(recommendations.job_id);
          // Aggiorna l'URL con il job_id
          const params = new URLSearchParams(window.location.search);
          params.set("job_id", recommendations.job_id);
          window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        }
        
        // Imposta un intervallo di polling di 5 secondi
        const interval = window.setInterval(() => {
          console.log("Esecuzione polling...");
          refetch();
        }, 5000);
        
        setPollingInterval(interval);
      }
    } else if (recommendations && (!recommendations.status || recommendations.status === "SUCCESS")) {
      // Se il job è completato, ferma il polling
      if (pollingInterval) {
        console.log("Job completato, ferma il polling");
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
    
    // Pulizia quando il componente si smonta
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [recommendations, jobId, pollingInterval, refetch]);

  useEffect(() => {
    if (error) {
      // If error is a 404 (no preferences found), redirect to preferences page
      if ((error as any).message?.includes("404")) {
        setLocation("/preferences");
      }
    }
  }, [error, setLocation]);

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <MainLayout>
      <section className="py-16 bg-yookve-light">
        <div className="container mx-auto px-4">
          <h2 className="font-montserrat font-bold text-3xl mb-2 text-center">Le tue proposte personalizzate</h2>
          <p className="text-center text-gray-600 mb-6">
            Ecco i tuoi pacchetti su misura in base alle tue preferenze
          </p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="packages">Pacchetti</TabsTrigger>
              <TabsTrigger value="itinerary">Itinerario Dettagliato</TabsTrigger>
            </TabsList>
            
            <TabsContent value="packages">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
                </div>
              ) : recommendations && recommendations.status && recommendations.status !== "SUCCESS" ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-yookve-red mb-4" />
                  <p className="text-lg font-medium">Elaborazione in corso...</p>
                  <p className="text-gray-500 mt-2">Stiamo creando i tuoi pacchetti personalizzati</p>
                  <p className="text-sm text-gray-400 mt-4">Job ID: {recommendations.job_id}</p>
                </div>
              ) : recommendations && recommendations.packages && recommendations.packages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {recommendations.packages.map((travelPackage) => (
                    <TravelCard key={travelPackage.id} travelPackage={travelPackage} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Nessuna proposta trovata. Prova a modificare le tue preferenze.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="itinerary">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
                </div>
              ) : cityPackages ? (
                <CityExperiencePackage data={cityPackages} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Nessun itinerario dettagliato disponibile. Prova a modificare le tue preferenze.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </MainLayout>
  );
}
