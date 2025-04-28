import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema di validazione per le preferenze
const formSchema = z.object({
  // Passioni
  passioni: z.array(z.string()).min(1, "Seleziona almeno una passione"),

  // Luoghi da non perdere
  luoghiDaNonPerdere: z.string(),
  luoghiSpecifici: z.string().optional(),

  // Tipo di destinazioni
  tipoDestinazioni: z.string(),

  // Ritmo del viaggio
  ritmoViaggio: z.string(),

  // Livello di sistemazione
  livelloSistemazione: z.string(),

  // Tipologia di sistemazione
  tipologiaSistemazione: z.array(z.string()).min(1, "Seleziona almeno una tipologia di sistemazione"),

  // Numero di viaggiatori
  numAdulti: z.string().transform(Number).refine(val => val >= 1, "È richiesto almeno un adulto"),
  numBambini: z.string().transform(Number),
  numNeonati: z.string().transform(Number),

  // Numero di camere
  numCamere: z.string().transform(Number).refine(val => val >= 1, "È richiesta almeno una camera"),

  // Tipologia di viaggiatore
  tipologiaViaggiatore: z.string(),

  // Date del viaggio
  checkInDate: z.date(),
  checkOutDate: z.date(),

  // Località di arrivo e partenza
  localitaArrivoPartenza: z.string(),
  dettagliArrivoPartenza: z.string().optional(),

  // Budget
  budget: z.string(),

  // Servizi speciali
  serviziSpeciali: z.string().optional(),

  // Email di contatto
  email: z.string().email("Inserisci un indirizzo email valido"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PreferenceForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showSpecificPlaces, setShowSpecificPlaces] = useState(false);
  const [showTravelDetails, setShowTravelDetails] = useState(false);

  // Inizializza il form con valori predefiniti
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passioni: [],
      luoghiDaNonPerdere: "no",
      tipoDestinazioni: "entrambi",
      ritmoViaggio: "moderato",
      livelloSistemazione: "boutique",
      tipologiaSistemazione: [],
      numAdulti: "2",
      numBambini: "0",
      numNeonati: "0",
      numCamere: "1",
      tipologiaViaggiatore: "coppia",
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      localitaArrivoPartenza: "non_so",
      budget: "mid_range",
      email: "",
    },
  });

  // Gestisce il cambio di luoghi da non perdere
  const handleLuoghiChange = (value: string) => {
    form.setValue("luoghiDaNonPerdere", value);
    setShowSpecificPlaces(value === "si");
  };

  // Gestisce il cambio di località di arrivo e partenza
  const handleLocalitaChange = (value: string) => {
    form.setValue("localitaArrivoPartenza", value);
    setShowTravelDetails(value === "si");
  };

  const onSubmit = (data: FormValues) => {
    toast({
      title: "Preferenze inviate",
      description: "Le tue preferenze sono state inviate con successo. Ti contatteremo presto!",
    });

    console.log(data);
    // Qui potete inviare i dati al backend

    // Reindirizza alla home dopo l'invio
    setTimeout(() => navigate("/"), 2000);
  };

  // Lista delle opzioni per le passioni
  const passioniOptions = [
    { id: "storia", label: "Storia e arte" },
    { id: "archeologia", label: "Siti archeologici" },
    { id: "musei", label: "Musei e gallerie" },
    { id: "architettura", label: "Monumenti e architetture" },
    { id: "food_wine", label: "Food & Wine" },
    { id: "cantine", label: "Visite alle cantine" },
    { id: "wine_country", label: "Soggiorni nella Wine Country" },
    { id: "corsi_cucina", label: "Corsi di cucina" },
    { id: "vacanze_attive", label: "Vacanze attive" },
    { id: "trekking", label: "Trekking tour" },
    { id: "ebike", label: "Tour in e-bike" },
    { id: "bicicletta", label: "Tour in bicicletta" },
    { id: "sci", label: "Sci/snowboard" },
    { id: "local_life", label: "Local Life" },
    { id: "benessere", label: "Salute & Benessere" },
  ];

  // Lista delle opzioni per le tipologie di sistemazione
  const sistemazioni = [
    { id: "hotel", label: "Hotel" },
    { id: "bb", label: "B&B" },
    { id: "agriturismo", label: "Agriturismo" },
    { id: "villa", label: "Villa" },
    { id: "appartamento", label: "Appartamento" },
    { id: "glamping", label: "Glamping" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-8 text-center">Configura il tuo viaggio</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Sezione Passioni */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Le tue passioni:</h2>
            <FormField
              control={form.control}
              name="passioni"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {passioniOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="passioni"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Luoghi da non perdere */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Hai dei luoghi da non perdere?</h2>
            <FormField
              control={form.control}
              name="luoghiDaNonPerdere"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => handleLuoghiChange(value)}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          No, sono aperto alle vostre proposte
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="si" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Sì, ho alcune Città/Regioni che voglio assolutamente vedere
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSpecificPlaces && (
              <FormField
                control={form.control}
                name="luoghiSpecifici"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Indica i luoghi che desideri visitare</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Es. Roma, Costiera Amalfitana, Toscana..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator />

          {/* Tipo di destinazioni */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Mete clou o luoghi fuori dagli itinerari più popolari: cosa preferisci?</h2>
            <FormField
              control={form.control}
              name="tipoDestinazioni"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="popolari" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Voglio vivere le mete di maggior interesse: destinazioni popolari che offrono molte attività e opzioni di alloggio.
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fuori_itinerari" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Voglio sperimentare ciò che l'Italia ha da offrire al riparo dalla folla: un'ottima opzione per i viaggiatori interessati all'avventura o alla cultura locale.
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="entrambi" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Sono aperto a entrambe le opzioni.
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Ritmo del viaggio */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quale di questi descrive il ritmo ideale per il tuo viaggio?</h2>
            <FormField
              control={form.control}
              name="ritmoViaggio"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="veloce" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Veloce: vedere il più possibile nell'arco del viaggio, trascorrendo 1-2 notti in ogni località.
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="moderato" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Moderato: un mix di soggiorni più lunghi e soste veloci, trascorrendo 2-3 notti in ogni località.
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="rilassato" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Rilassato: limitarsi a poche destinazioni, trascorrendo 3-4 notti in ogni località.
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Livello di sistemazione */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quale è il livello di sistemazione che preferisci?</h2>
            <FormField
              control={form.control}
              name="livelloSistemazione"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="media" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Sistemazioni di fascia media, accoglienti e ben posizionate.
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="boutique" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Boutique: affascinanti e confortevoli sistemazioni con strutture di buon livello e un servizio attento.
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="lusso" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Sistemazioni eleganti e lussuose, con servizi di alto livello.
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Tipologia di sistemazione */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quale è la tipologia di sistemazione ideale?</h2>
            <FormField
              control={form.control}
              name="tipologiaSistemazione"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sistemazioni.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="tipologiaSistemazione"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Numero di viaggiatori e camere */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Numero di viaggiatori</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="numAdulti"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adulti</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numBambini"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bambini (3-12 anni)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numNeonati"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neonati (0-2 anni)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <FormField
                control={form.control}
                name="numCamere"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di camere</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full md:w-1/3">
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Tipologia di viaggiatore */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Tipologia di viaggiatore:</h2>
            <FormField
              control={form.control}
              name="tipologiaViaggiatore"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="famiglia" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Famiglia
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="coppia" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Coppia
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="amici" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Gruppo di amici
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="azienda" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Azienda
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Date del viaggio */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Periodo:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-in</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: it })
                            ) : (
                              <span>Seleziona data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-out</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: it })
                            ) : (
                              <span>Seleziona data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const checkIn = form.getValues("checkInDate");
                            return date < new Date() || (checkIn && date < checkIn);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Località di arrivo e partenza */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Conosci già le località di arrivo e partenza per questo viaggio?</h2>
            <FormField
              control={form.control}
              name="localitaArrivoPartenza"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => handleLocalitaChange(value)}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="non_so" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Non so ancora
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="auto" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Userò la mia auto
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="si" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Sì, conosco già le località di arrivo e partenza (volo/treno)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showTravelDetails && (
              <FormField
                control={form.control}
                name="dettagliArrivoPartenza"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Indica i dettagli di arrivo e partenza</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Es. Arrivo a Roma Fiumicino il 10/06, partenza da Milano Malpensa il 17/06..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator />

          {/* Budget */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Hai in mente un budget specifico per questo viaggio?</h2>
            <p className="text-sm text-gray-600 mb-4">I viaggi di Yookye comprendono soggiorno, esperienze e trasferimenti.</p>
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="economy" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Budget, meno di € 150 a persona/giorno
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mid_range" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Mid-range, tra € 150 - € 250 a persona/giorno
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="comfort" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Comfort, tra € 250 - € 400 a persona/giorno
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="lusso" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Lusso, &euro; 400 a persona/giorno
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="nessuno" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Non ho un budget specifico in mente
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Servizi speciali */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Servizi speciali / Esigenze particolari:</h2>
            <FormField
              control={form.control}
              name="serviziSpeciali"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Indica eventuali servizi speciali o esigenze particolari (allergie, accessibilità, etc.)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Email */}
          <div>
            <h2 className="text-xl font-semibold mb-4">E-mail:</h2>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="La tua email di contatto" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit"
            className="w-full bg-yookve-red hover:bg-red-700 text-white py-6"
          >
            Invia
          </Button>
        </form>
      </Form>
    </div>
  );
}