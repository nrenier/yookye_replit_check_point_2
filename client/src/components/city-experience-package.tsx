
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  data: CityPackageData;
}

export default function CityExperiencePackage({ data }: CityExperiencePackageProps) {
  const cities = Object.keys(data.accomodation);
  const [selectedCity, setSelectedCity] = useState(cities[0] || "");

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="font-montserrat font-bold text-3xl mb-6 text-center">Il tuo itinerario personalizzato</h2>
      
      <Tabs defaultValue={cities[0]} onValueChange={setSelectedCity}>
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
                    {data.esperienze[city].map((exp, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="font-semibold text-lg">
                          {exp.alias[0]}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
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
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-gray-500">Nessuna esperienza disponibile per questa città.</p>
                )}
              </div>

              {/* Accommodations Column */}
              <div>
                <h3 className="font-montserrat font-bold text-2xl mb-4">Sistemazioni a {city}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {data.accomodation[city] && data.accomodation[city].map((hotel, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{hotel.name}</CardTitle>
                            <CardDescription className="text-sm">{hotel.address}</CardDescription>
                          </div>
                          <div className="flex items-center">
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
                        <Button>Prenota</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
