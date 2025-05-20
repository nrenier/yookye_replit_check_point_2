
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { checkJobStatus, getNewPackages, localApiRequest, saveNewPackage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import NewTravelCard from "@/components/new-travel-card";
import { NewPackageResponse } from "@shared/schema";

export default function ResultsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('PENDING');
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [travelPackages, setTravelPackages] = useState<NewPackageResponse[]>([]);
  const { toast } = useToast();

  // Estrai il job_id dalla query string o dal localStorage, se presente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobIdParam = params.get("job_id") || localStorage.getItem('yookve_job_id');
    if (jobIdParam) {
      setJobId(jobIdParam);
      setIsPolling(true); // Start polling if jobId is found
    }
  }, []);

  // Query per recuperare i pacchetti salvati dall'utente
  const { data: savedPackages, isLoading: savedPackagesLoading } = useQuery({
    queryKey: ["saved-packages"],
    queryFn: async () => {
      try {
        const response = await localApiRequest("GET", "/saved-packages");
        return response.data?.data || [];
      } catch (error) {
        console.error("Errore nel recupero dei pacchetti salvati:", error);
        return [];
      }
    },
    enabled: !!user // Attiva la query solo se l'utente è autenticato
  });

  // Effettua il polling se abbiamo un job_id
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 5;

    const pollJobStatus = async () => {
      if (!jobId) return;

      try {
        // Verifica che l'utente sia ancora autenticato
        if (!user) {
          console.error("Utente non autenticato durante il polling");
          setIsPolling(false);
          return;
        }

        const statusResponse = await checkJobStatus(jobId);
        console.log("Polling status:", statusResponse);
        setPollingStatus(statusResponse.status);
        failedAttempts = 0; // Reset il contatore degli errori

        if (statusResponse.status === 'COMPLETED') {
          console.log("Recupero i risultati del job:", `/api/search/${jobId}/result`);

          // Recupera i nuovi pacchetti direttamente dall'endpoint esterno /search
          const results = await getNewPackages(jobId);
          console.log("Risultati dei pacchetti ricevuti:", results);

          // Imposta i pacchetti ricevuti nello stato
          if (Array.isArray(results)) {
            setTravelPackages(results);
          }

          setIsPolling(false);
        } else if (statusResponse.status === 'FAILED') {
          console.error("Job di ricerca fallito.", statusResponse);
          setIsPolling(false);
          toast({
            title: "Ricerca fallita",
            description: "Si è verificato un errore durante la ricerca. Riprova.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Errore durante il polling:", error);
        failedAttempts += 1;

        // Se ci sono troppi tentativi falliti consecutivi, interrompi il polling
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.error("Troppi tentativi falliti, interrompo il polling");
          setIsPolling(false);
          toast({
            title: "Errore di comunicazione",
            description: "Impossibile verificare lo stato della ricerca. Riprova più tardi.",
            variant: "destructive",
          });
        }
      }
    };

    // Start polling if isPolling is true and jobId and user are available
    if (isPolling && jobId && user) {
      pollJobStatus(); // Initial poll
      pollingInterval = setInterval(pollJobStatus, 3000);
    } else if (isPolling && !user) {
      // Interrompe il polling se l'utente non è autenticato
      console.log("Utente non autenticato, interrompo il polling");
      setIsPolling(false);
    }

    // Clear interval on component unmount or when polling stops
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [jobId, isPolling, user, toast]);

  // Funzione per salvare un pacchetto
  const handleSavePackage = async (packageData: NewPackageResponse) => {
    if (!user) {
      toast({
        title: "Accesso negato",
        description: "Devi essere autenticato per salvare un pacchetto.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveNewPackage(packageData);
      toast({
        title: "Pacchetto salvato",
        description: "Il pacchetto è stato salvato con successo! Lo trovi in 'I miei pacchetti'.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Errore di salvataggio",
        description: `Non è stato possibile salvare il pacchetto: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Determine what to display
  const isLoading = isPolling || savedPackagesLoading;
  const hasPackages = travelPackages.length > 0;
  const hasSavedPackages = savedPackages && savedPackages.length > 0;

  return (
    <MainLayout>
      <section className="py-16 bg-yookve-light">
        <div className="container mx-auto px-4">
          <h2 className="font-montserrat font-bold text-3xl mb-2 text-center">Le tue proposte personalizzate</h2>
          <p className="text-center text-gray-600 mb-6">
            Ecco i tuoi pacchetti su misura in base alle tue preferenze
          </p>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
              <p className="mt-4 text-lg text-gray-600">
                {pollingStatus === 'PENDING'
                  ? "Stiamo avviando la ricerca dei pacchetti..."
                  : pollingStatus === 'STARTED'
                    ? "Stiamo cercando i pacchetti migliori per te..."
                    : pollingStatus === 'PROCESSING'
                      ? "Stiamo finalizzando le tue proposte di pacchetti..."
                      : "Caricamento pacchetti..."}
              </p>
              {isPolling && pollingStatus && pollingStatus !== 'COMPLETED' && (
                <p className="mt-2 text-sm text-gray-500">
                  Stato attuale ricerca: {pollingStatus}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {/* Pacchetti trovati dalla ricerca - Mostrati direttamente come restituiti dall'API */}
              {hasPackages && (
                <div>
                  <h2 className="font-montserrat font-bold text-2xl mb-4 border-b pb-2">Pacchetti Consigliati</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {travelPackages.map((packageData) => (
                      <NewTravelCard 
                        key={packageData.id_pacchetto} 
                        packageData={packageData} 
                        showSaveButton={true}
                        onSave={() => handleSavePackage(packageData)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pacchetti salvati */}
              {hasSavedPackages && (
                <div>
                  <h2 className="font-montserrat font-bold text-2xl mb-4 border-b pb-2">I Tuoi Pacchetti Salvati</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {savedPackages.map((pkg) => (
                      <div key={pkg.id || pkg.id_pacchetto} className="card-wrapper">
                        {/* Usa il nuovo formato per i pacchetti salvati */}
                        {pkg.id_pacchetto ? (
                          <NewTravelCard packageData={pkg as unknown as NewPackageResponse} />
                        ) : (
                          <div className="card border p-4 rounded-lg shadow-sm">
                            <h3 className="font-semibold">{pkg.title}</h3>
                            <p className="text-sm text-gray-600">Destinazione: {pkg.destination}</p>
                            <p className="text-sm text-gray-600">Prezzo: €{pkg.price}</p>
                            <div className="mt-2">
                              <Button size="sm" onClick={() => setLocation(`/package-detail/${pkg.id}`)}>
                                Dettagli
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Se non ci sono pacchetti da mostrare */}
              {!hasPackages && !hasSavedPackages && (
                <div className="text-center py-10">
                  <p className="text-gray-500">Nessun pacchetto disponibile. Prova a modificare le tue preferenze o a ricercare nuovi pacchetti.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setLocation("/preferences")}
                  >
                    Crea Nuova Ricerca
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
