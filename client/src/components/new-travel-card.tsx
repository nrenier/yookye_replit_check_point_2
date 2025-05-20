import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Star, Save, ShoppingCart } from 'lucide-react';
import { Badge } from './ui/badge';
import { NewPackageResponse } from '@shared/schema';

interface NewTravelCardProps {
  packageData: NewPackageResponse;
  showSaveButton?: boolean;
  onSave?: () => void;
  onBook?: () => void;
}

export default function NewTravelCard({ packageData, showSaveButton = false, onSave, onBook }: NewTravelCardProps) {
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Estrazione dei dati dal pacchetto
  const {
    id_pacchetto,
    titolo,
    descrizione,
    master = {},
    detail = {},
  } = packageData;

  // Dati dal master
  const {
    citta_coinvolte = [],
    temi_viaggio = [],
    prezzo_totale = 0,
  } = master;

  // Gestisce l'azione di visualizzazione dei dettagli
  const handleViewDetails = () => {
    setLocation(`/package-detail/${id_pacchetto}`);
  };

  // Calcola il numero di notti in base agli hotel (se disponibili)
  const numNights = detail.hotels?.length || 0;

  return (
    <Card 
      className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg border-2 border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Mostra immagine placeholder o l'immagine del pacchetto se disponibile */}
        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
          <img 
            src={detail.cover_image || '/images/placeholder-travel.jpg'} 
            alt={titolo} 
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Badge per prezzo */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-yookve-red hover:bg-yookve-red/90">
            {prezzo_totale > 0 ? `€${prezzo_totale}` : 'Prezzo su richiesta'}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-2">{titolo}</CardTitle>
        </div>
        <CardDescription className="flex items-center text-sm space-x-1 mt-1">
          {/* <Icons.mapPin className="h-3.5 w-3.5 text-yookve-red" /> */}
          <span>{citta_coinvolte.length > 0 ? citta_coinvolte.join(', ') : 'Varie destinazioni'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow pb-2">
        {/* Descrizione */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{descrizione}</p>

        {/* Dettagli del pacchetto */}
        <div className="space-y-2">
          {/* Durata */}
          {numNights > 0 && (
            <div className="flex items-center text-sm text-gray-700">
              {/* <Icons.calendar className="h-4 w-4 mr-2 text-yookve-red" /> */}
              <span>{numNights} {numNights === 1 ? 'notte' : 'notti'}</span>
            </div>
          )}

          {/* Hotel */}
          {detail.hotels && detail.hotels.length > 0 && (
            <div className="flex items-center text-sm text-gray-700">
              {/* <Icons.hotel className="h-4 w-4 mr-2 text-yookve-red" /> */}
              <span>{detail.hotels.length} {detail.hotels.length === 1 ? 'hotel' : 'hotel'}</span>
            </div>
          )}

          {/* Tour */}
          {detail.tours && detail.tours.length > 0 && (
            <div className="flex items-center text-sm text-gray-700">
              {/* <Icons.map className="h-4 w-4 mr-2 text-yookve-red" /> */}
              <span>{detail.tours.length} {detail.tours.length === 1 ? 'tour' : 'tour'}</span>
            </div>
          )}
        </div>

        {/* Tag del viaggio */}
        {temi_viaggio && temi_viaggio.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {temi_viaggio.slice(0, 3).map((tema, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                {tema}
              </Badge>
            ))}
            {temi_viaggio.length > 3 && (
              <Badge variant="outline" className="text-xs bg-gray-50">
                +{temi_viaggio.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-4 gap-2 flex">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={handleViewDetails}
        >
          <Eye className="h-4 w-4 mr-1" /> Dettagli
        </Button>

        {showSaveButton && onSave && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={onSave}
          >
            <Save className="h-4 w-4 mr-1" /> Salva
          </Button>
        )}

        {onBook && (
          <Button 
            size="sm" 
            className="flex-1 bg-yookve-red hover:bg-red-700"
            onClick={onBook}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Prenota
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}