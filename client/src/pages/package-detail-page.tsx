import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Redirect } from "wouter";
import MainLayout from "@/components/layouts/main-layout";
import { TravelPackage } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import BookingForm from "@/components/booking-form";

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: travelPackage, isLoading, error } = useQuery<TravelPackage>({
    queryKey: [`/api/travel-packages/${id}`],
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
        </div>
      </MainLayout>
    );
  }

  if (error || !travelPackage) {
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => window.history.back()}
        >
          <i className="fas fa-arrow-left mr-2"></i> Torna ai risultati
        </Button>

        {/* Hero Section */}
        <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
          <img 
            src={travelPackage.imageUrl} 
            alt={travelPackage.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-white mb-2">
              {travelPackage.title}
            </h1>
            <div className="flex items-center text-white mb-2">
              <i className="fas fa-map-marker-alt mr-2"></i>
              <span>{travelPackage.destination}</span>
            </div>
            
            <div className="flex items-center text-white">
              <div className="text-yellow-400 flex mr-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const rating = parseFloat(travelPackage.rating || "0");
                  if (index < Math.floor(rating)) {
                    return <i key={index} className="fas fa-star"></i>;
                  } else if (index === Math.floor(rating) && rating % 1 >= 0.5) {
                    return <i key={index} className="fas fa-star-half-alt"></i>;
                  } else {
                    return <i key={index} className="far fa-star"></i>;
                  }
                })}
              </div>
              <span>{travelPackage.rating}/5 ({travelPackage.reviewCount} recensioni)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-montserrat font-semibold text-2xl mb-4">Descrizione</h2>
                <p className="text-gray-700 mb-6">{travelPackage.description}</p>
                
                <h3 className="font-montserrat font-semibold text-xl mb-3">Dettagli del viaggio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <i className="fas fa-hotel text-yookve-red w-6"></i>
                    <div>
                      <p className="text-sm text-gray-500">Alloggio</p>
                      <p>{travelPackage.accommodationName}</p>
                      <p className="text-sm text-gray-500">{travelPackage.accommodationType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <i className={`fas ${
                      travelPackage.transportType?.includes("Volo") ? "fa-plane-departure" :
                      travelPackage.transportType?.includes("Treno") ? "fa-train" :
                      travelPackage.transportType?.includes("Auto") ? "fa-car" : "fa-car"
                    } text-yookve-red w-6`}></i>
                    <div>
                      <p className="text-sm text-gray-500">Trasporto</p>
                      <p>{travelPackage.transportType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <i className="fas fa-calendar-alt text-yookve-red w-6"></i>
                    <div>
                      <p className="text-sm text-gray-500">Durata</p>
                      <p>{travelPackage.durationDays} giorni / {travelPackage.durationNights} notti</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <i className="fas fa-tag text-yookve-red w-6"></i>
                    <div>
                      <p className="text-sm text-gray-500">Categorie</p>
                      <p>{travelPackage.categories?.join(", ")}</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-montserrat font-semibold text-xl mb-3">Esperienze incluse</h3>
                <ul className="space-y-2 mb-6">
                  {travelPackage.experiences?.map((experience, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-yookve-red mr-2 mt-1"></i>
                      <span>{experience}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - Price and Booking */}
          <div>
            <Card className="mb-6 sticky top-20">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-gray-500">Prezzo a persona</p>
                  <p className="text-3xl font-bold text-yookve-red">€{travelPackage.price}</p>
                  <p className="text-sm text-gray-500">Tasse incluse</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-gray-700">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Cancellazione gratuita fino a 7 giorni prima</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Pagamento sicuro</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <i className="fas fa-check text-green-500 mr-2"></i>
                    <span>Assistenza 24/7</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full bg-yookve-red hover:bg-red-700 text-lg py-6" 
                  onClick={() => setShowBookingForm(true)}
                >
                  Prenota ora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Booking Form Dialog */}
        {showBookingForm && (
          <BookingForm 
            travelPackage={travelPackage} 
            onClose={() => setShowBookingForm(false)} 
          />
        )}
      </div>
    </MainLayout>
  );
}