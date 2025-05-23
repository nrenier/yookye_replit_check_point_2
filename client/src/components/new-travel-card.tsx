import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NewPackageResponse {
  id_pacchetto: string;
  hotels_selezionati: {
    [city: string]: {
      name: string;
      star_rating: number;
      daily_prices: number;
      checkin: string;
      checkout: string;
      description: string;
    };
  };
  esperienze_selezionate: {
    [city: string]: {
      alias: string[];
      descrizione: string;
      dettagli: {
        durata?: string;
        tipo_attivita?: string;
      };
    };
  };
}

interface NewTravelCardProps {
  packageData: NewPackageResponse;
  showSaveButton?: boolean;
  onSave?: () => void;
}

export default function NewTravelCard({ packageData, showSaveButton = false, onSave }: NewTravelCardProps) {
  // Calcola il prezzo totale sommando i prezzi giornalieri degli hotel
  const totalPrice = Object.values(packageData.hotels_selezionati).reduce((sum, hotel) => {
    return sum + hotel.daily_prices;
  }, 0);

  // Prendi la prima città come riferimento per l'hotel principale
  const firstCity = Object.keys(packageData.hotels_selezionati)[0];
  const mainHotel = packageData.hotels_selezionati[firstCity];

  // Calcola la durata totale del soggiorno
  const firstHotel = Object.values(packageData.hotels_selezionati)[0];
  const checkIn = new Date(firstHotel.checkin.split('/').reverse().join('-'));
  const checkOut = new Date(firstHotel.checkout.split('/').reverse().join('-'));
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img 
          src={`https://source.unsplash.com/800x400/?${firstCity}`}
          alt={`Vista di ${firstCity}`}
          className="w-full h-full object-cover"
        />
      </div>

      <CardContent className="p-6">
        <h3 className="font-montserrat font-bold text-xl mb-2">
          Tour {Object.keys(packageData.hotels_selezionati).join(" e ")}
        </h3>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-hotel w-6 text-gray-600"></i>
            <span>{mainHotel.name} {[...Array(mainHotel.star_rating)].map((_, i) => '⭐').join('')}</span>
          </div>

          <div className="flex items-center">
            <i className="fas fa-calendar-alt w-6 text-gray-600"></i>
            <span>{nights} notti</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-montserrat font-semibold text-lg mb-2">Esperienze incluse:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {Object.entries(packageData.esperienze_selezionate).map(([city, exp]) => (
              <li key={`${city}-${exp.alias[0]}`}>✓ {exp.alias[0]}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-sm text-gray-500">a partire da</p>
            <p className="text-xl font-bold">€{Math.round(totalPrice)} <span className="text-sm font-normal">/ persona</span></p>
          </div>

          {showSaveButton && (
            <Button onClick={onSave} variant="outline">
              Salva
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}