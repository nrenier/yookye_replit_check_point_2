
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

  // Lista delle città nel pacchetto
  const cities = Object.keys(packageData.hotels_selezionati);
  
  // Prendi la prima città come riferimento per l'immagine
  const firstCity = cities[0];

  // Calcola la durata totale del soggiorno per la prima città
  const firstHotel = packageData.hotels_selezionati[firstCity];
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
          Tour {cities.join(" e ")}
        </h3>

        <Accordion type="single" collapsible className="w-full">
          {cities.map((city) => (
            <AccordionItem key={city} value={city}>
              <AccordionTrigger className="text-lg font-semibold">
                {city}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Hotel</h4>
                    <div className="flex items-center">
                      <i className="fas fa-hotel w-6 text-gray-600"></i>
                      <span>{packageData.hotels_selezionati[city].name} {[...Array(packageData.hotels_selezionati[city].star_rating)].map((_, i) => '⭐').join('')}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{packageData.hotels_selezionati[city].description}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">Esperienze</h4>
                    {packageData.esperienze_selezionate[city] && (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {packageData.esperienze_selezionate[city].alias.map((exp, index) => (
                          <li key={index}>✓ {exp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-sm text-gray-500">a partire da</p>
            <p className="text-xl font-bold">€{Math.round(totalPrice)} <span className="text-sm font-normal">/ giorno</span></p>
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
