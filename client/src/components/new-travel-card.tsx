import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPackageResponse } from "@shared/schema";
import { MapPin, Hotel, Calendar, Tag } from "lucide-react";

interface NewTravelCardProps {
  packageData: NewPackageResponse;
  showSaveButton?: boolean;
  onSave?: () => void;
}

export default function NewTravelCard({ packageData, showSaveButton = false, onSave }: NewTravelCardProps) {
  // Calcola il prezzo totale sommando i prezzi giornalieri degli hotel
  const totalPrice = packageData.detail.hotels.reduce((total, hotel) => total + hotel.prezzo_giornaliero, 0);

  // Prendi il primo hotel per l'immagine e la destinazione principale
  const mainHotel = packageData.detail.hotels[0];
  const mainCity = mainHotel?.citta.charAt(0).toUpperCase() + mainHotel?.citta.slice(1);

  return (
    <Card className="w-full bg-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {`Viaggio a ${packageData.master.citta_coinvolte.map(city => 
            city.charAt(0).toUpperCase() + city.slice(1)).join(" e ")}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{`${packageData.master.citta_coinvolte.length} città`}</span>
        </div>

        <div className="flex items-center gap-2">
          <Hotel className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{`${packageData.master.numero_hotel} hotel - ${packageData.detail.hotels[0].stelle} stelle`}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{`${packageData.master.durata_complessiva_soggiorni_giorni} giorni`}</span>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <div className="flex flex-wrap gap-1">
            {packageData.master.temi_viaggio.map((tema, index) => (
              <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {tema.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-lg font-bold text-right">
            {`€ ${totalPrice.toFixed(2)}`}
          </p>
        </div>
      </CardContent>

      {showSaveButton && onSave && (
        <CardFooter>
          <Button 
            onClick={onSave}
            className="w-full bg-yookve-red hover:bg-yookve-red/90 text-white"
          >
            Salva Pacchetto
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}