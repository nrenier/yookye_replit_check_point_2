
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Calendar, Euro, Hotel, Route } from "lucide-react";
import { NewPackageResponse } from "@shared/schema";
import { Link } from "wouter";

interface NewTravelCardProps {
  packageData: NewPackageResponse;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export default function NewTravelCard({ packageData, onSave, showSaveButton = false }: NewTravelCardProps) {
  // Calcolo del prezzo totale del pacchetto (somma di tutti gli hotel)
  const totalPrice = packageData.detail.hotels.reduce(
    (sum, hotel) => sum + hotel.prezzo_giornaliero, 
    0
  );
  
  // Recupero il primo hotel per l'anteprima
  const primaryHotel = packageData.detail.hotels[0];
  
  // Calcolo durata del viaggio
  const duration = packageData.master.durata_complessiva_soggiorni_giorni;
  
  // Recupero la prima esperienza per l'anteprima se disponibile
  const primaryExperience = packageData.detail.esperienze[0];

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div 
        className="h-48 bg-cover bg-center w-full" 
        style={{ backgroundImage: "url('https://source.unsplash.com/random/800x600/?" + primaryHotel.citta + "')" }}
      >
        <div className="p-2">
          <Badge variant="secondary" className="bg-white/80 text-black">
            {packageData.detail.hotels.length} Hotel - {packageData.detail.esperienze.length} Esperienze
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            Viaggio tra {packageData.master.citta_coinvolte.join(" e ")}
          </CardTitle>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm ml-1">{primaryHotel.stelle}</span>
          </div>
        </div>
        <CardDescription className="text-sm flex items-center mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          {packageData.master.citta_coinvolte.join(", ")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="space-y-2 mt-2">
          <div className="flex items-center text-sm">
            <Hotel className="h-4 w-4 mr-2 text-gray-500" />
            <span className="line-clamp-1">{packageData.detail.hotels.map(h => h.nome).join(", ")}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{duration} {duration === 1 ? "giorno" : "giorni"}</span>
          </div>
          
          {primaryExperience && (
            <div className="flex items-center text-sm">
              <Route className="h-4 w-4 mr-2 text-gray-500" />
              <span className="line-clamp-1">{primaryExperience.nome}</span>
            </div>
          )}
          
          <div className="mt-3">
            {packageData.master.temi_viaggio.map((tema) => (
              <Badge key={tema} variant="outline" className="mr-1 mb-1">
                {tema.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t mt-2">
        <div className="font-bold text-xl">
          €{totalPrice.toFixed(0)}
          <span className="text-xs font-normal text-gray-500">/totale</span>
        </div>
        
        <div className="flex gap-2">
          {showSaveButton && (
            <Button size="sm" variant="outline" onClick={onSave}>
              Salva
            </Button>
          )}
          <Button 
            size="sm" 
            as={Link} 
            href={`/package-detail/${packageData.id_pacchetto}`}
          >
            Dettagli
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
