import { useEffect, useState } from "react";
import { TravelPackage } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addDays, format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2 } from "lucide-react";

// Schema di validazione per la prenotazione
const bookingFormSchema = z.object({
  travelDate: z.string().refine(val => {
    const date = new Date(val);
    const today = new Date();
    return date >= today;
  }, { message: "La data di partenza deve essere futura" }),
  returnDate: z.string(),
  numAdults: z.string().transform(Number).refine(val => val >= 1, { 
    message: "È richiesto almeno un adulto"
  }),
  numChildren: z.string().transform(Number).optional(),
  numInfants: z.string().transform(Number).optional(),
  contactEmail: z.string().email({ message: "Inserisci un indirizzo email valido" }),
  contactPhone: z.string().min(6, { message: "Inserisci un numero di telefono valido" }),
  specialRequests: z.string().optional(),
}).refine(data => {
  const travelDate = new Date(data.travelDate);
  const returnDate = new Date(data.returnDate);
  return returnDate > travelDate;
}, {
  message: "La data di ritorno deve essere successiva alla data di partenza",
  path: ["returnDate"]
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  travelPackage: TravelPackage;
  onClose: () => void;
}

export default function BookingForm({ travelPackage, onClose }: BookingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [totalPrice, setTotalPrice] = useState<number>(travelPackage.price);
  
  // Inizializza il form con valori predefiniti
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      travelDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      returnDate: format(addDays(new Date(), 30 + travelPackage.durationDays), "yyyy-MM-dd"),
      numAdults: "2",
      numChildren: "0",
      numInfants: "0",
      contactEmail: user?.email || "",
      contactPhone: "",
      specialRequests: "",
    },
  });
  
  // Ricalcola il prezzo totale quando cambiano i valori
  useEffect(() => {
    const values = form.getValues();
    const adults = parseInt(values.numAdults) || 0;
    const children = parseInt(values.numChildren || "0") || 0;
    const infants = parseInt(values.numInfants || "0") || 0;
    
    // Calcola il prezzo totale (adulti pagano intero, bambini metà, neonati gratis)
    const calculatedPrice = (adults * travelPackage.price) + (children * travelPackage.price * 0.5);
    setTotalPrice(calculatedPrice);
  }, [form.watch("numAdults"), form.watch("numChildren"), form.watch("numInfants"), travelPackage.price]);
  
  // Mutation per creare una prenotazione
  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      if (!user) throw new Error("Utente non autenticato");
      
      const response = await apiRequest("POST", "/api/bookings", {
        packageId: travelPackage.id,
        travelDate: data.travelDate,
        returnDate: data.returnDate,
        numAdults: parseInt(data.numAdults),
        numChildren: parseInt(data.numChildren || "0"),
        numInfants: parseInt(data.numInfants || "0"),
        totalPrice: totalPrice,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        specialRequests: data.specialRequests,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalida la cache delle prenotazioni per aggiornare la lista
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Prenotazione effettuata",
        description: "La tua prenotazione è stata inviata con successo.",
      });
      onClose();
      // Redirect alla pagina delle prenotazioni
      setLocation("/bookings");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile completare la prenotazione: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: BookingFormValues) => {
    bookingMutation.mutate(data);
  };
  
  return (
    <Dialog open={true} onOpenChange={() => !bookingMutation.isPending && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Prenota il tuo viaggio</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per prenotare il pacchetto "{travelPackage.title}"
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date del viaggio */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Date del viaggio</h3>
                
                <FormField
                  control={form.control}
                  name="travelDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data di partenza</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data di ritorno</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Viaggiatori */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Viaggiatori</h3>
                
                <FormField
                  control={form.control}
                  name="numAdults"
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
                
                <FormField
                  control={form.control}
                  name="numChildren"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bambini (2-12 anni)</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="numInfants"
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
                          {[0, 1, 2].map((num) => (
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
              
              {/* Contatti */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="font-semibold text-lg">Informazioni di contatto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Richieste speciali (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Inserisci eventuali richieste speciali, allergie, esigenze particolari..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Riepilogo prezzi */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-2">Riepilogo</h3>
              <div className="flex justify-between mb-2">
                <span>Prezzo a persona:</span>
                <span>€{travelPackage.price}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>
                  {form.watch("numAdults") || 0} adulti × €{travelPackage.price}
                </span>
                <span>€{parseInt(form.watch("numAdults") || "0") * travelPackage.price}</span>
              </div>
              {parseInt(form.watch("numChildren") || "0") > 0 && (
                <div className="flex justify-between mb-2">
                  <span>
                    {form.watch("numChildren")} bambini × €{travelPackage.price * 0.5} (50%)
                  </span>
                  <span>€{parseInt(form.watch("numChildren") || "0") * travelPackage.price * 0.5}</span>
                </div>
              )}
              {parseInt(form.watch("numInfants") || "0") > 0 && (
                <div className="flex justify-between mb-2">
                  <span>{form.watch("numInfants")} neonati</span>
                  <span>Gratuito</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                <span>Totale:</span>
                <span>€{totalPrice}</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={bookingMutation.isPending}
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                className="bg-yookve-red hover:bg-red-700"
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Prenotazione in corso...
                  </>
                ) : (
                  "Conferma prenotazione"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}