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
      address: string;
      room_type?: string;
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
  const averagePrice = Object.values(packageData.hotels_selezionati).reduce((sum, hotel) => {
    return sum + hotel.daily_prices;
  }, 0) / Object.values(packageData.hotels_selezionati).length;

  const cities = Object.keys(packageData.hotels_selezionati);
  const firstCity = cities[0];
  const firstHotel = packageData.hotels_selezionati[firstCity];
  const checkIn = new Date(firstHotel.checkin.split('/').reverse().join('-'));
  const checkOut = new Date(firstHotel.checkout.split('/').reverse().join('-'));
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img 
          src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80"
          alt="Viaggio in Italia"
          className="w-full h-full object-cover"
        />
      </div>

      <CardContent className="p-6">
        <h3 className="font-montserrat font-bold text-xl mb-4">
          Tour {cities.join(" e ")}
        </h3>

        <div className="space-y-4">
          {Object.entries(packageData.hotels_selezionati).map(([city, hotel]) => (
            <div key={city} className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">{city}</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <i className="fas fa-hotel w-6 text-gray-600"></i>
                  <span>{hotel.name} {[...Array(hotel.star_rating)].map((_, i) => '⭐').join('')}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>📍 {hotel.address}</p>
                  <p>💶 €{hotel.daily_prices}/notte</p>
                  <p>📅 Check-in: {hotel.checkin}</p>
                  <p>📅 Check-out: {hotel.checkout}</p>
                  {hotel.room_type && <p>🛏️ {hotel.room_type}</p>}
                </div>
              </div>
            </div>
          ))}

          {Object.entries(packageData.esperienze_selezionate).map(([city, experience]) => (
            <div key={city} className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">Esperienze a {city}</h4>
              <ul className="text-sm text-gray-600">
                {experience.alias.map((exp, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>✓</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-sm text-gray-500">a partire da</p>
            <p className="text-xl font-bold">€{Math.round(averagePrice)} <span className="text-sm font-normal">/ giorno</span></p>
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