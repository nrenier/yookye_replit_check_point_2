import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query"; // Import useMutation
import MainLayout from "@/components/layouts/main-layout";
import TravelCard from "@/components/travel-card";
import CityExperiencePackage, { CityPackageData, Selections, Accommodation, Experience } from "@/components/city-experience-package"; // Import Selections, Accommodation, Experience types
import { TravelPackage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2, Save } from "lucide-react"; // Import Save icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkJobStatus, getJobResults, apiRequest, localApiRequest, getSavedPackages } from "@/lib/api"; // Import apiRequest and getSavedPackages
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card"; // Import Card and CardFooter


export default function ResultsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("packages");
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('PENDING');
  const [pollingResults, setPollingResults] = useState<CityPackageData | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [userSelections, setUserSelections] = useState<Selections>({});
  const [composedPackages, setComposedPackages] = useState<TravelPackage[]>([]); // State for composed packages
  const [itineraryData, setItineraryData] = useState<any | null>(null); // State for detailed itinerary data

  const { toast } = useToast();

  // Mutation to save a composed package (NEW)
  const savePackageMutation = useMutation({
    mutationFn: async (packageData: TravelPackage) => {
        // Call the new backend endpoint to save the package
        const res = await localApiRequest("POST", "/saved-packages", packageData);
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.message || "Errore nel salvataggio del pacchetto");
        }
        return await res.json();
    },
    onSuccess: () => {
        toast({
            title: "Pacchetto salvato",
            description: "Il pacchetto è stato salvato con successo! Lo trovi in 'I miei pacchetti'.",
            variant: "default",
        });
        // Optionally clear selections or update UI after saving
    },
    onError: (error: Error) => {
        toast({
            title: "Errore di salvataggio",
            description: `Non è stato possibile salvare il pacchetto: ${error.message}`,
            variant: "destructive",
        });
    },
  });

  // Estrai il job_id dalla query string o dal localStorage, se presente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobIdParam = params.get("job_id") || localStorage.getItem('yookve_job_id');
    if (jobIdParam) {
      setJobId(jobIdParam);
      setIsPolling(true); // Start polling if jobId is found
    }
  }, []);

  // This useQuery was likely intended for pre-generated packages or was part of the old flow.
  // With the new polling mechanism, we rely on pollingResults.
  // Keeping it for now if it serves another purpose, but removing cityPackages logic.
  // Query per recuperare i pacchetti raccomandati
  const { data: recommendations, isLoading: packagesLoading, error: packagesError, refetch } = useQuery<any>({
    queryKey: ["/api/recommendations", jobId],
    queryFn: async () => {
      // This endpoint might need adjustment depending on how the backend handles package listing now.
      const endpoint = jobId ? `/api/recommendations?job_id=${jobId}` : "/api/recommendations";
      const response = await fetch(endpoint);
      if (!response.ok) {
        // Handle non-JSON responses like 404 more gracefully
        if (response.status === 404) {
          return { packages: [] }; // Return empty array if not found
        } 
        throw new Error(`Errore durante il recupero dei dati: ${response.statusText}`);
      }
       // Check if response is valid JSON before parsing
       const contentType = response.headers.get("content-type");
       if (contentType && contentType.indexOf("application/json") !== -1) {
           return response.json();
       } else {
           // Handle cases where backend might return non-JSON on success (less likely)
           console.warn("Received non-JSON response from recommendations endpoint");
           return { packages: [] }; // Return empty structure
       }
    },
     // Disable this query if polling is active and pollingResults are not yet set
    enabled: !!jobId && !isPolling && !pollingResults // Modified enabled condition
  });

  // Nuova query per recuperare i pacchetti salvati dall'utente
  const { data: savedPackages, isLoading: savedPackagesLoading, error: savedPackagesError } = useQuery({
    queryKey: ["saved-packages"],
    queryFn: async () => {
      try {
        const data = await getSavedPackages();
        return data;
      } catch (error) {
        console.error("Errore nel recupero dei pacchetti salvati:", error);
        return [];
      }
    },
    enabled: !!user // Attiva la query solo se l'utente è autenticato
  });

  // Removed the useQuery for cityPackages mock data

  const isLoading = packagesLoading || isPolling || savedPackagesLoading; // Updated loading condition
  const error = packagesError || savedPackagesError; // Updated error condition

  // Function to handle selections change from CityExperiencePackage
  const handleSelectionsChange = useCallback((selections: Selections) => {
    console.log("Selections changed:", selections);
    setUserSelections(selections);
  }, []); // useCallback to prevent unnecessary re-creations


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
          // Optionally redirect to auth page if user is not authenticated
          // setLocation("/auth");
          return;
        }

        const statusResponse = await checkJobStatus(jobId);
        console.log("Polling status:", statusResponse);
        setPollingStatus(statusResponse.status);
        failedAttempts = 0; // Reset il contatore degli errori

        if (statusResponse.status === 'COMPLETED') {
          console.log("Recupero i risultati del job:", `/api/search/${jobId}/result`);
          const results = await getJobResults(jobId);
          console.log("Risultati ricevuti:", results);
          setPollingResults(results);

          // Fetch the detailed itinerary in parallel
          try {
            const itineraryResponse = await localApiRequest("GET", `/api/saved-packages/itinerary?job_id=${jobId}`);
            console.log("Itinerary response:", itineraryResponse.data);
            if (itineraryResponse.data && itineraryResponse.data.success) {
              setItineraryData(itineraryResponse.data.data);
            }
          } catch (itineraryError) {
            console.error("Error fetching detailed itinerary:", itineraryError);
            // Continue anyway, as we have the package results
          }


          setIsPolling(false);
          // Optional: remove job_id from localStorage after successful completion
          // localStorage.removeItem('yookve_job_id');

        } else if (statusResponse.status === 'FAILED') {
             console.error("Job di ricerca fallito.", statusResponse);
             setIsPolling(false);
             // Handle failure, e.g., show an error message and maybe redirect
             toast({
                title: "Ricerca fallita",
                description: "Si è verificato un errore durante la ricerca. Riprova.",
                variant: "destructive",
             });
             // Optionally clear job_id from localStorage on failure
             // localStorage.removeItem('yookve_job_id');
             // Optionally redirect user after failure
             // setTimeout(() => setLocation("/preferences"), 3000);

        } // Add other relevant statuses like 'PENDING', 'PROCESSING' if needed for UI updates

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
            // Optionally clear job_id from localStorage on repeated errors
            // localStorage.removeItem('yookve_job_id');
            // Optionally redirect user after repeated errors
            // setTimeout(() => setLocation("/preferences"), 3000);
        }
      }
    };

    // Start polling if isPolling is true and jobId and user are available
    // Stop polling if pollingResults are received or polling failed
    if (isPolling && jobId && user && !pollingResults && pollingStatus !== 'FAILED') {
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
  }, [jobId, isPolling, user, pollingResults, pollingStatus, toast, setLocation]); // Added dependencies

  // Use another useEffect to trigger refetching recommendations once polling results are available
  useEffect(() => {
    if (pollingResults && jobId && !isPolling) {
        // Optionally refetch the 'packages' data if needed, or rely solely on pollingResults
        // refetch(); // Uncomment if you still need to fetch packages via the recommendations endpoint
        console.log("Polling complete, results available.");
        // You might want to process pollingResults here or directly in the render logic
    }
  }, [pollingResults, jobId, isPolling, refetch]); // Added dependencies: refetch


  useEffect(() => {
    if (error) {
      // Assuming a 404 on recommendations endpoint might mean no packages found for the job_id
      // or the job_id is invalid after polling fails/completes without packages.
      // Re-evaluate this redirect logic based on how your backend signals no packages.
      if ((error as any).message?.includes("404")) {
        console.warn("Recommendations query returned 404.", error);
        // setLocation("/preferences"); // Consider if you always want to redirect on 404
      }
       // Add handling for other potential errors from the recommendations query
       console.error("Error fetching recommendations:", error);
    }
  }, [error, setLocation]);

  // Function to compose packages based on user selections
  const handleComposePackage = () => {
      if (!pollingResults || Object.keys(userSelections).length === 0) {
          toast({
              title: "Nessuna selezione",
              description: "Seleziona almeno una sistemazione e una o più esperienze per comporre un pacchetto.",
              variant: "warning",
          });
          return;
      }

      const composed: TravelPackage[] = [];

      // Iterate through each city in userSelections
      Object.keys(userSelections).forEach(city => {
          const citySelections = userSelections[city];
          const selectedAccommodationId = citySelections.selectedAccommodationId;
          const selectedExperienceIds = citySelections.selectedExperienceIds;

          // Only compose a package for this city if an accommodation is selected
          if (selectedAccommodationId) {
              // Find the full accommodation details from pollingResults
              const selectedAccommodation = pollingResults.accomodation[city]?.find(
                  acc => acc.id === selectedAccommodationId
              );

              // Find the full experience details from pollingResults
              const selectedExperiences = selectedExperienceIds.map(expId => {
                  const parts = expId.split('-');
                  const originalIndex = parseInt(parts[2], 10);
                  return pollingResults.esperienze[city]?.[originalIndex];
              }).filter(exp => exp !== undefined) as Experience[]; // Add type assertion

              if (selectedAccommodation) {
                   // Construct a basic TravelPackage object
                   const newPackage: TravelPackage = {
                       id: `composed-${city}-${Date.now()}`,
                       title: `Viaggio Personalizzato a ${city}`,
                       description: `Pacchetto composto con ${selectedAccommodation.name} e ${selectedExperiences.length} esperienze.`,
                       destination: city,
                       imageUrl: selectedAccommodation.imageUrl || '', 
                       rating: selectedAccommodation.star_rating ? String(selectedAccommodation.star_rating) : '', 
                       reviewCount: selectedAccommodation.reviewCount || 0, 
                       accommodationName: selectedAccommodation.name,
                       accommodationType: selectedAccommodation.kind,
                       transportType: '', 
                       durationDays: 0, 
                       durationNights: 0, 
                       // Make sure experiences is an array of strings if TravelPackage schema expects that
                       // Or adjust TravelPackage schema if it should hold Experience objects
                       experiences: selectedExperiences.map(exp => exp.alias[0]), // Assuming TravelPackage wants string[]
                       price: selectedAccommodation.daily_prices || 0, 
                       isRecommended: false, 
                       categories: [], // Add relevant categories based on selections
                       // Add any other required fields with default/mapped values
                   };
                   composed.push(newPackage);
              }
          }
      });

      console.log("Composed Packages:", composed);
      setComposedPackages(composed); // Store the composed packages
      // setActiveTab("packages"); // Switch to the packages tab to show the result - maybe better to do this manually
  };

  // Function to handle saving a composed package (NEW)
  const handleSavePackage = async (packageToSave: TravelPackage) => {
      if (!user) {
          toast({
              title: "Accesso negato",
              description: "Devi essere autenticato per salvare un pacchetto.",
              variant: "destructive",
          });
          // Optionally redirect to login page
          // setLocation("/auth");
          return;
      }

      // Call the mutation to save the package
      savePackageMutation.mutate(packageToSave);
  };


  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Determine what to display while loading/polling or if there are results/errors
  const displayLoading = isLoading || (isPolling && !pollingResults && pollingStatus !== 'FAILED');
  const displayError = error && !displayLoading; // Display query error if present and not in loading state
  const displayPollingError = pollingStatus === 'FAILED' && !pollingResults;

  // Check if recommendations are loaded and are an array
  const validRecommendations = recommendations && recommendations.packages && Array.isArray(recommendations.packages);

  // Display packages if valid recommendations exist OR composed packages exist OR saved packages exist
  const displayAnyPackages = 
    (validRecommendations && recommendations.packages.length > 0) || 
    composedPackages.length > 0 || 
    (savedPackages && savedPackages.length > 0);
  // Display conditions for the packages tab content
  const showPackagesContent = displayAnyPackages && !displayLoading && !displayError && !displayPollingError;

  // Display itinerary if pollingResults exist and we are not loading or in an error state
  const displayItinerary = itineraryData && !displayLoading && !displayError && !displayPollingError;

  // Check if there are no packages AND no itinerary results after loading/polling is done
  const displayNoResults = !displayLoading && !displayError && !displayPollingError && !showPackagesContent && !displayItinerary;


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
              {displayLoading ? (
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
              ) : showPackagesContent ? (
                <div className="space-y-10">
                  {/* Sezione Pacchetti Raccomandati */}
                  {validRecommendations && recommendations.packages && recommendations.packages.length > 0 && (
                    <div>
                      <h2 className="font-montserrat font-bold text-2xl mb-4 border-b pb-2">Pacchetti Raccomandati</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {recommendations.packages.map((travelPackage) => (
                          <TravelCard key={travelPackage.id} travelPackage={travelPackage} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sezione Pacchetti Composti */}
                  {composedPackages && composedPackages.length > 0 && (
                    <div>
                      <h2 className="font-montserrat font-bold text-2xl mb-4 border-b pb-2">Pacchetti Personalizzati</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {composedPackages.map((travelPackage) => (
                          <Card key={travelPackage.id} className="overflow-hidden flex flex-col">
                              <TravelCard travelPackage={travelPackage} />
                              <CardFooter className="mt-auto pt-4 flex justify-end">
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSavePackage(travelPackage)}
                                    disabled={savePackageMutation.isPending}
                                  >
                                    <Save className="w-4 h-4 mr-1" /> Salva Pacchetto
                                </Button>
                              </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sezione Pacchetti Salvati */}
                  {savedPackages && savedPackages.length > 0 && (
                    <div>
                      <h2 className="font-montserrat font-bold text-2xl mb-4 border-b pb-2">I Tuoi Pacchetti Salvati</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {savedPackages.map((pkg) => (
                          <TravelCard key={pkg.id} travelPackage={pkg} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Se non ci sono pacchetti da mostrare */}
                  {(!validRecommendations || recommendations.packages.length === 0) && 
                   (!composedPackages || composedPackages.length === 0) && 
                   (!savedPackages || savedPackages.length === 0) && (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Nessun pacchetto disponibile. Prova a modificare le tue preferenze o a comporre un pacchetto personalizzato.</p>
                    </div>
                  )}
                </div>
              ) : displayError || displayPollingError ? (
                   <div className="text-center py-10 text-red-600">
                       <p>Errore durante il caricamento dei pacchetti.</p>
                        {displayPollingError && (<p>La ricerca non è riuscita a completarsi.</p>)}
                        {error && (<p>Dettagli: {(error as Error).message}</p>)} 
                   </div>
              ) : displayNoResults ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Nessun pacchetto trovato. Prova a modificare le tue preferenze.</p>
                </div>
              ) : null /* Render nothing if none of the above conditions are met */}

               {/* Add area to display composed package based on userSelections here later */}
                {/* Example: Display userSelections for debugging */}
                {/*
                {userSelections && Object.keys(userSelections).length > 0 && (
                     <div className="mt-10">
                        <h3 className="font-semibold mb-4">Pacchetto Personalizzato (Selezione):</h3>
                         <pre className="bg-gray-100 p-4 rounded-md text-left">
                             {JSON.stringify(userSelections, null, 2)}
                         </pre>
                     </div>
                )}
                */}
            </TabsContent>

            <TabsContent value="itinerary">
              {displayLoading ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
                   <p className="mt-4 text-lg text-gray-600">
                     {pollingStatus === 'PENDING'
                       ? "Stiamo avviando la creazione dell'itinerario..."
                       : pollingStatus === 'STARTED'
                         ? "Stiamo definendo i dettagli del tuo itinerario..."
                         : pollingStatus === 'PROCESSING'
                           ? "Stiamo generando l'itinerario dettagliato..."
                           : "Caricamento itinerario..."}
                   </p>
                  {isPolling && pollingStatus && pollingStatus !== 'COMPLETED' && (
                     <p className="mt-2 text-sm text-gray-500">
                       Stato attuale ricerca: {pollingStatus}
                     </p>
                   )}
                </div>
              ) : displayItinerary ? (
                // Render CityExperiencePackage and pass the selections and the handler
                <>
                   <CityExperiencePackage data={itineraryData} onSelectionsChange={handleSelectionsChange} />
                   {/* Add the Compose Package button below CityExperiencePackage */} 
                   <div className="mt-8 text-center">
                      <Button onClick={handleComposePackage} disabled={Object.keys(userSelections).length === 0 || Object.values(userSelections).every(citySel => !citySel.selectedAccommodationId)}> {/* Disable if no selections */} 
                         Componi Pacchetto Personalizzato
                      </Button>
                   </div>
                </>

              ) : displayError || displayPollingError ? (
                  <div className="text-center py-10 text-red-600">
                      <p>Errore durante il caricamento dell'itinerario dettagliato.</p>
                       {displayPollingError && (<p>La ricerca non è riuscita a completarsi.</p>)}
                       {error && (<p>Dettagli: {(error as Error).message}</p>)} 
                  </div>
              ) : displayNoResults ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Nessun itinerario dettagliato disponibile. Prova a modificare le tue preferenze.</p>
                </div>
              ) : null /* Render nothing if none of the above conditions are met */}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </MainLayout>
  );
}