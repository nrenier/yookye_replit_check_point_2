
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import { useParams, useLocation } from "wouter";
import { Loader2, MapPin, Calendar, Star, Clock, Info, Tag, Bookmark, CheckCircle } from "lucide-react";
import { localApiRequest, apiRequest, saveNewPackage } from "@/lib/api";
import { NewPackageResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PackageDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isNewFormat, setIsNewFormat] = useState(false);

  // Query per recuperare il dettaglio del pacchetto
  const { data: packageDetail, isLoading, error } = useQuery({
    queryKey: ["package-detail", id],
    queryFn: async () => {
      try {
        // Prima proviamo a recuperare con il nuovo formato
        const newFormatResponse = await apiRequest("GET", `/api/search/package/${id}`);
        
        if (newFormatResponse.data) {
          setIsNewFormat(true);
          return newFormatResponse.data;
        }
      } catch (newFormatError) {
        console.log("Pacchetto nel nuovo formato non trovato, provo con il formato precedente");
      }
      
      // Se fallisce, proviamo con il formato precedente
      try {
        const oldFormatResponse = await localApiRequest("GET", `/saved-packages/${id}`);
        if (oldFormatResponse.data && oldFormatResponse.data.success) {
          setIsNewFormat(false);
          return oldFormatResponse.data.data;
        }
      } catch (oldFormatError) {
        console.error("Errore nel recupero del pacchetto:", oldFormatError);
        throw oldFormatError;
      }
      
      throw new Error("Pacchetto non trovato");
    },
  });

  // Handler per salvare il pacchetto
  const handleSavePackage = async () => {
    if (!user) {
      toast({
        title: "Accesso negato",
        description: "Devi essere autenticato per salvare un pacchetto.",
        variant: "destructive",
      });
      return;
    }

    if (!packageDetail) {
      toast({
        title: "Errore",
        description: "Nessun pacchetto da salvare.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isNewFormat) {
        await saveNewPackage(packageDetail);
      } else {
        await localApiRequest("POST", "/saved-packages", packageDetail);
      }
      
      toast({
        title: "Pacchetto salvato",
        description: "Il pacchetto è stato salvato con successo.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: `Non è stato possibile salvare il pacchetto: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !packageDetail) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h2 className="font-montserrat font-bold text-2xl mb-4 text-red-600">
            Errore nel caricamento del pacchetto
          </h2>
          <p className="text-gray-600 mb-4">
            Non è stato possibile trovare il pacchetto richiesto. Torna alla pagina dei risultati e riprova.
          </p>
          <Button onClick={() => window.history.back()}>Torna indietro</Button>
        </div>
      </MainLayout>
    );
  }

  // Rendering per il nuovo formato
  if (isNewFormat) {
    const newPackage = packageDetail as NewPackageResponse;
    const totalPrice = newPackage.detail.hotels.reduce(
      (sum, hotel) => sum + hotel.prezzo_giornaliero, 
      0
    );
    
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="outline" 
            className="mb-6" 
            onClick={() => window.history.back()}
          >
            Torna ai risultati
          </Button>
          
          {/* Header del pacchetto */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div 
              className="h-64 bg-cover bg-center w-full" 
              style={{ 
                backgroundImage: `url('https://source.unsplash.com/random/1200x800/?${newPackage.master.citta_coinvolte.join(",")}')` 
              }}
            >
              <div className="w-full h-full bg-black bg-opacity-40 p-6 flex flex-col justify-end">
                <h1 className="text-white text-3xl font-bold">
                  Viaggio tra {newPackage.master.citta_coinvolte.join(" e ")}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPackage.master.temi_viaggio.map(tema => (
                    <Badge key={tema} className="bg-white/80 text-black">
                      {tema.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-0">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{newPackage.master.durata_complessiva_soggiorni_giorni} giorni</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{newPackage.master.citta_coinvolte.join(", ")}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold">
                    €{totalPrice.toFixed(0)}
                    <span className="text-xs font-normal text-gray-500">/totale</span>
                  </div>
                  <Button onClick={handleSavePackage}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Salva Pacchetto
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dettagli del pacchetto con tabs */}
          <Tabs defaultValue="alloggi" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="alloggi">Alloggi</TabsTrigger>
              <TabsTrigger value="esperienze">Esperienze</TabsTrigger>
              <TabsTrigger value="riepilogo">Riepilogo</TabsTrigger>
            </TabsList>
            
            {/* Tab Alloggi */}
            <TabsContent value="alloggi">
              <div className="grid grid-cols-1 gap-6">
                {newPackage.detail.hotels.map((hotel, index) => (
                  <Card key={hotel.id_originale_hotel} className="overflow-hidden">
                    <div className="md:flex">
                      <div 
                        className="md:w-1/4 h-48 md:h-auto bg-cover bg-center"
                        style={{ 
                          backgroundImage: `url('https://source.unsplash.com/random/600x400/?hotel,${hotel.citta}')` 
                        }}
                      ></div>
                      <div className="md:w-3/4">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{hotel.nome}</CardTitle>
                              <div className="flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                                <span className="text-sm text-gray-600">{hotel.indirizzo}, {hotel.citta}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {Array.from({ length: hotel.stelle }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Dettagli soggiorno</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                  <span>Check-in: {new Date(hotel.checkin).toLocaleDateString('it-IT')}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                  <span>Check-out: {new Date(hotel.checkout).toLocaleDateString('it-IT')}</span>
                                </div>
                                <div className="flex items-center">
                                  <Info className="h-4 w-4 mr-2 text-gray-500" />
                                  <span>{hotel.tipo_camera} - Pasto incluso: {hotel.pasto_incluso}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Prezzo</h4>
                              <div className="text-xl font-bold">
                                €{hotel.prezzo_giornaliero.toFixed(0)}
                                <span className="text-xs font-normal text-gray-500">/giorno</span>
                              </div>
                              <p className="text-sm mt-1">Contatti: {hotel.telefono} - {hotel.email}</p>
                            </div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div>
                            <h4 className="font-medium mb-2">Descrizione</h4>
                            <p className="text-sm text-gray-700">{hotel.descrizione}</p>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Tab Esperienze */}
            <TabsContent value="esperienze">
              <div className="grid grid-cols-1 gap-6">
                {newPackage.detail.esperienze.map((experience) => (
                  <Card key={experience.nome} className="overflow-hidden">
                    <div className="md:flex">
                      <div 
                        className="md:w-1/4 h-48 md:h-auto bg-cover bg-center"
                        style={{ 
                          backgroundImage: `url('https://source.unsplash.com/random/600x400/?${experience.citta},activity')` 
                        }}
                      ></div>
                      <div className="md:w-3/4">
                        <CardHeader>
                          <CardTitle>{experience.nome}</CardTitle>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="text-sm text-gray-600">{experience.citta}, {experience.provincia}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Descrizione</h4>
                            <p className="text-sm text-gray-700">{experience.descrizione}</p>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Tipologia</h4>
                            <div className="flex flex-wrap gap-1">
                              {experience.tipologia.split(',').map((tipo, index) => (
                                <Badge key={index} variant="outline">
                                  {tipo.trim().replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Tag</h4>
                            <div className="flex flex-wrap gap-1">
                              {experience.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {experience.dettagli_specifici && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Dettagli specifici</h4>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {Object.entries(experience.dettagli_specifici).map(([key, value]) => (
                                  <div key={key}>
                                    <dt className="font-medium text-gray-700">{key.replace(/_/g, " ")}:</dt>
                                    <dd className="text-gray-600">
                                      {typeof value === 'string' 
                                        ? value 
                                        : Array.isArray(value) 
                                          ? value.join(', ') 
                                          : JSON.stringify(value)}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(experience.url, '_blank')}
                            >
                              Visita Sito Web
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Tab Riepilogo */}
            <TabsContent value="riepilogo">
              <Card>
                <CardHeader>
                  <CardTitle>Riepilogo del Viaggio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-lg mb-2">Destinazioni</h4>
                      <div className="flex flex-wrap gap-2">
                        {newPackage.master.citta_coinvolte.map((citta) => (
                          <Badge key={citta} className="px-3 py-1" variant="outline">
                            <MapPin className="h-4 w-4 mr-1" />
                            {citta}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-lg mb-2">Durata</h4>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                        <span>{newPackage.master.durata_complessiva_soggiorni_giorni} giorni</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-lg mb-2">Temi del viaggio</h4>
                      <div className="flex flex-wrap gap-2">
                        {newPackage.master.temi_viaggio.map((tema) => (
                          <Badge key={tema} className="px-3 py-1">
                            <Tag className="h-4 w-4 mr-1" />
                            {tema.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-lg mb-2">Riepilogo costi</h4>
                      <div className="space-y-2">
                        {newPackage.detail.hotels.map((hotel) => (
                          <div key={hotel.id_originale_hotel} className="flex justify-between">
                            <span>{hotel.nome} ({hotel.citta})</span>
                            <span>€{hotel.prezzo_giornaliero.toFixed(0)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Totale</span>
                          <span>€{totalPrice.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-lg">Include:</h4>
                        <ul className="mt-2 space-y-1">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>{newPackage.detail.hotels.length} hotel</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>{newPackage.detail.esperienze.length} esperienze</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>Prima colazione</span>
                          </li>
                        </ul>
                      </div>
                      
                      <Button onClick={handleSavePackage}>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Salva Pacchetto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    );
  }
  
  // Rendering per il vecchio formato (codice già esistente)
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => window.history.back()}
        >
          Torna ai risultati
        </Button>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h1 className="text-2xl font-bold">{packageDetail.title}</h1>
            <p className="text-gray-600 mt-2">{packageDetail.description}</p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                <span>{packageDetail.destination}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <span>{packageDetail.durationDays} giorni / {packageDetail.durationNights} notti</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                <span>{packageDetail.rating} ({packageDetail.reviewCount} recensioni)</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-2xl font-bold">
                €{packageDetail.price}
                <span className="text-xs font-normal text-gray-500">/persona</span>
              </div>
              <Button onClick={handleSavePackage}>
                <Bookmark className="h-4 w-4 mr-2" />
                Salva Pacchetto
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dettagli del pacchetto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Alloggio</h3>
                    <p className="text-gray-700">{packageDetail.accommodationName} ({packageDetail.accommodationType})</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Esperienze incluse</h3>
                    <ul className="list-disc pl-5 mt-2">
                      {packageDetail.experiences?.map((exp, idx) => (
                        <li key={idx} className="text-gray-700">{exp}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Trasporto</h3>
                    <p className="text-gray-700">{packageDetail.transportType || "Non specificato"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Categorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {packageDetail.categories?.map((category, idx) => (
                    <Badge key={idx} variant="outline">{category}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
