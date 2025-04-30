import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface Accommodation {
  hid: number;
  name: string;
  address: string;
  phone: string;
  kind: string;
  latitude: number;
  longitude: number;
  star_rating: number;
  email: string;
  description: string;
  id: string;
  daily_prices: number;
  meal: string;
  room_name: string;
}

export interface Experience {
  url: string[];
  alias: string[];
  stato: string[];
  provincia: string[];
  citta: string[];
  descrizione: string;
  dettagli: any;
  tags: string[];
  dati_extra: string;
  tipologia: string;
}

export interface CityPackageData {
  accomodation: Record<string, Accommodation[]>;
  esperienze: Record<string, Experience[]>;
}

interface CityExperiencePackageProps {
  data: CityPackageData | null;
  onSelectionsChange?: (selections: Selections) => void;
}

export interface Selections {
  [city: string]: {
    selectedAccommodationId: string | null;
    selectedExperienceIds: string[];
  };
}

export default function CityExperiencePackage({ data, onSelectionsChange }: CityExperiencePackageProps) {
  const cities = data ? Object.keys(data.accomodation) : [];
  const [selectedCity, setSelectedCity] = useState(cities[0] || "");
  const [selections, setSelections] = useState<Selections>({});

  // Initialize selections state when data prop changes, only if not already initialized for these cities
  useEffect(() => {
    if (data && cities.length > 0) {
      setSelections(prevSelections => {
        // Check if selections are already initialized for all current cities
        const allCitiesInitialized = cities.every(city => prevSelections.hasOwnProperty(city));

        if (!allCitiesInitialized) {
          const initialSelections: Selections = {};
           cities.forEach(city => {
             initialSelections[city] = {
               selectedAccommodationId: prevSelections[city]?.selectedAccommodationId || null, // Preserve existing selections if any
               selectedExperienceIds: prevSelections[city]?.selectedExperienceIds || [] // Preserve existing selections if any
             };
           });
          return initialSelections;
        }

        return prevSelections; // Otherwise, return current state to avoid unnecessary updates
      });
      // Set the initial selected city after data is loaded and selections potentially initialized
      if (cities.length > 0 && !selectedCity) {
         setSelectedCity(cities[0]);
      }

    }
  }, [data, cities, selectedCity]); // Depend on data and cities. Added selectedCity to handle initial tab set.


  // Call parent callback when selections change
  useEffect(() => {
    // Only call if onSelectionsChange exists and selections object is not empty
    if (onSelectionsChange && Object.keys(selections).length > 0) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange]);

  if (!data || cities.length === 0) {
    return <div className="text-center text-gray-500">Nessun dato disponibile per l'itinerario dettagliato.</div>;
  }

  const handleAccommodationSelect = (city: string, accommodationId: string) => {
    setSelections(prevSelections => ({
      ...prevSelections,
      [city]: {
        ...prevSelections[city],
        selectedAccommodationId: accommodationId
      }
    }));
  };

  const handleExperienceSelect = (city: string, experienceId: string, isSelected: boolean) => {
    setSelections(prevSelections => {
      const currentSelected = prevSelections[city]?.selectedExperienceIds || [];
      const newSelected = isSelected
        ? [...currentSelected, experienceId]
        : currentSelected.filter(id => id !== experienceId);
      return {
        ...prevSelections,
        [city]: {
          ...prevSelections[city],
          selectedExperienceIds: newSelected
        }
      };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="font-montserrat font-bold text-3xl mb-6 text-center">Il tuo itinerario personalizzato</h2>

      {/* Use selectedCity for the controlled Tabs component */}
      <Tabs value={selectedCity} onValueChange={setSelectedCity}>
        <TabsList className="grid grid-cols-2 w-full max-w-lg mx-auto mb-8">
          {cities.map(city => (
            <TabsTrigger key={city} value={city}>{city}</TabsTrigger>
          ))}
        </TabsList>

        {cities.map(city => (
          <TabsContent key={city} value={city}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Experiences Column */}
              <div>
                <h3 className="font-montserrat font-bold text-2xl mb-4">Esperienze a {city}</h3>
                {data.esperienze[city] && data.esperienze[city].length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {data.esperienze[city].map((exp, index) => {
                       // Using a simple index for key and ID for now. 
                       // Ideally, backend provides a stable unique ID for experiences.
                       const experienceId = `exp-${city}-${index}`;
                       const isSelected = selections[city]?.selectedExperienceIds.includes(experienceId) || false;

                      return (
                      <AccordionItem key={experienceId} value={experienceId}>
                        <AccordionTrigger className="font-semibold text-lg">
                          <div className="flex items-center space-x-3">
                             <Checkbox
                                id={`exp-${experienceId}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleExperienceSelect(city, experienceId, !!checked)}
                                // Prevent accordion toggle when clicking checkbox
                                onClick={(e) => e.stopPropagation()}
                             />
                             <Label htmlFor={`exp-${experienceId}`} className="flex-1 cursor-pointer">
                               {exp.alias[0]}
                             </Label>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pl-7"> {/* Added padding to align with checkbox */}
                            <p>{exp.descrizione}</p>
                            <div className="mt-2">
                              <h4 className="font-medium">Tipologia:</h4>
                              <p className="text-sm text-gray-600">{exp.tipologia}</p>
                            </div>
                            <div className="mt-2">
                              <h4 className="font-medium">Tags:</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {exp.tags.map((tag, idx) => (
                                  <span key={idx} className="bg-gray-100 text-xs rounded-full px-3 py-1">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {exp.url && exp.url[0] && (
                              <Button variant="outline" className="mt-2" onClick={() => window.open(exp.url[0], '_blank')}>
                                Scopri di più
                              </Button>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );})}
                  </Accordion>
                ) : (
                  <p className="text-gray-500">Nessuna esperienza disponibile per questa città.</p>
                )}
              </div>

              {/* Accommodations Column */}
              <div>
                <h3 className="font-montserrat font-bold text-2xl mb-4">Sistemazioni a {city}</h3>
                 {data.accomodation[city] && data.accomodation[city].length > 0 ? (
                  <RadioGroup
                     value={selections[city]?.selectedAccommodationId || ""}
                     onValueChange={(value) => handleAccommodationSelect(city, value)}
                     className="space-y-4"
                  >
                  {data.accomodation[city].map((hotel, index) => (

                      <div key={hotel.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={hotel.id} id={`hotel-${hotel.id}`} className="mt-0.5" />
                          <Label htmlFor={`hotel-${hotel.id}`} className="flex-1 cursor-pointer">
                              <Card className={cn("w-full", selections[city]?.selectedAccommodationId === hotel.id && "border-blue-500 ring-2 ring-blue-500")}> {/* Added ring for selected */}
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-xl">{hotel.name}</CardTitle>
                                      <CardDescription className="text-sm">{hotel.address}</CardDescription>
                                    </div>
                                    <div className="flex items-center flex-shrink-0">
                                      {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                        <span key={i} className="text-yellow-400">★</span>
                                      ))}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <p className="text-sm line-clamp-3">{hotel.description.substring(0, 150)}...</p>
                                    <div className="text-sm">
                                      <strong>Camera:</strong> {hotel.room_name}
                                    </div>
                                    {hotel.meal !== "nomeal" && (
                                      <div className="text-sm">
                                        <strong>Pasti inclusi:</strong> {hotel.meal === "breakfast" ? "Colazione" : hotel.meal}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                  <div className="text-xl font-bold">
                                    €{hotel.daily_prices} <span className="text-sm font-normal">/ notte</span>
                                  </div>
                                   {/* Removed individual "Prenota" button */}
                                </CardFooter>
                              </Card>
                          </Label>
                      </div>

                  ))}
                  </RadioGroup>
                 ) : (
                    <p className="text-gray-500">Nessuna sistemazione disponibile per questa città.</p>
                 )}

              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

       {/* Optional: Add a summary of selections or a button to compose the package */}
       {/* You will implement the package composition logic here or in the parent component */}
        <div className="mt-10 text-center">
            {/* Example: Display current selections (for debugging/demonstration) */}
             {/*
            <h3 className="font-semibold mb-4">Selezioni Attuali:</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-left">
                {JSON.stringify(selections, null, 2)}
            </pre>
             */}
            {/* Add a button to compose package here later */}
            {/* <Button onClick={handleComposePackage}>Componi Pacchetto</Button> */}
        </div>

    </div>
  );
}
