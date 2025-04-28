import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import MainLayout from "@/components/layouts/main-layout";
import { Booking, TravelPackage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { 
  Calendar, 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock 
} from "lucide-react";

// Inizializza Stripe
const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx"); // Usa il tuo publishable key qui
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Badge
} from "@/components/ui/badge";

// Componente per il modulo di pagamento
function CheckoutForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/bookings',
        },
        redirect: 'if_required'
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        onError("Pagamento non completato");
      }
    } catch (err) {
      onError(err.message || "Errore durante il pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          className="bg-yookve-red hover:bg-red-700 mt-4"
          disabled={!stripe || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Elaborazione...
            </>
          ) : (
            "Paga ora"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [isStripeReady, setIsStripeReady] = useState(false);

  // Recupera le prenotazioni dell'utente
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  // Recupera i dettagli dei pacchetti di viaggio
  const { data: travelPackages } = useQuery<TravelPackage[]>({
    queryKey: ["/api/travel-packages"],
    enabled: !!user,
  });

  // Mutation per aggiornare lo stato di una prenotazione
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Prenotazione aggiornata",
        description: "Lo stato della prenotazione è stato aggiornato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile aggiornare la prenotazione: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Crea un intento di pagamento reale con Stripe
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", '/api/create-payment-intent', {
        bookingId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Apri il form di pagamento Stripe
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setIsStripeReady(true);
        toast({
          title: "Pagamento iniziato",
          description: "Compila i dati della carta per procedere al pagamento.",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile ottenere i dati di pagamento",
          variant: "destructive",
        });
        setIsPaymentModalOpen(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile elaborare il pagamento: ${error.message}`,
        variant: "destructive",
      });
      setIsPaymentModalOpen(false);
    },
  });

  // Trova il pacchetto di viaggio associato a una prenotazione
  const findTravelPackage = (packageId: number) => {
    return travelPackages?.find(p => p.id === packageId);
  };

  // Gestisci il pagamento di una prenotazione
  const handlePayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
    setIsStripeReady(false);
    setClientSecret("");
    
    // Non creiamo immediatamente il payment intent, aspettiamo che l'utente clicchi su "Procedi al pagamento"
  };

  // Gestisci la cancellazione di una prenotazione
  const handleCancelBooking = (booking: Booking) => {
    updateBookingStatusMutation.mutate({
      id: booking.id,
      status: "cancelled"
    });
  };

  // Helper per le badge di stato
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Confermata</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Cancellata</Badge>;
      default:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> In attesa</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Pagato</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600"><CreditCard className="w-3 h-3 mr-1" /> Da pagare</Badge>;
    }
  };

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-montserrat font-bold text-3xl mb-6">Le tue prenotazioni</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const travelPackage = findTravelPackage(booking.packageId);
              return (
                <Card key={booking.id} className="overflow-hidden">
                  {travelPackage && (
                    <div className="relative h-48">
                      <img 
                        src={travelPackage.imageUrl} 
                        alt={travelPackage.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle>{travelPackage?.title || "Pacchetto viaggio"}</CardTitle>
                    <CardDescription>
                      {travelPackage?.destination} - Prenotato il {booking.bookingDate 
                        ? format(new Date(booking.bookingDate), "d MMMM yyyy", { locale: it })
                        : "Data non disponibile"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          Dal {format(new Date(booking.travelDate), "d MMMM yyyy", { locale: it })} 
                          al {format(new Date(booking.returnDate), "d MMMM yyyy", { locale: it })}
                        </span>
                      </div>

                      <div>
                        <p>
                          {booking.numAdults} {booking.numAdults === 1 ? "adulto" : "adulti"}
                          {booking.numChildren > 0 && `, ${booking.numChildren} ${booking.numChildren === 1 ? "bambino" : "bambini"}`}
                          {booking.numInfants > 0 && `, ${booking.numInfants} ${booking.numInfants === 1 ? "neonato" : "neonati"}`}
                        </p>
                        <p className="font-bold mt-2">
                          Totale: €{booking.totalPrice}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between">
                    {booking.status === "pending" && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">Annulla</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei sicuro di voler annullare?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. La prenotazione verrà cancellata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, mantieni</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleCancelBooking(booking)}
                              >
                                Sì, annulla
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {booking.paymentStatus === "unpaid" && (
                          <Button 
                            className="bg-yookve-red hover:bg-red-700"
                            onClick={() => handlePayment(booking)}
                          >
                            Paga ora
                          </Button>
                        )}
                      </>
                    )}

                    {booking.status === "confirmed" && (
                      <Button className="bg-green-600 hover:bg-green-700 ml-auto">
                        Dettagli viaggio
                      </Button>
                    )}

                    {booking.status === "cancelled" && (
                      <p className="text-gray-500 italic">
                        Questa prenotazione è stata cancellata
                      </p>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <h3 className="font-montserrat font-semibold text-xl mb-2">
              Non hai ancora nessuna prenotazione
            </h3>
            <p className="text-gray-600 mb-6">
              Esplora le nostre offerte personalizzate e prenota il tuo prossimo viaggio
            </p>
            <Button 
              className="bg-yookve-red hover:bg-red-700"
              onClick={() => window.location.href = "/"}
            >
              Scopri i pacchetti
            </Button>
          </div>
        )}
      </div>

      {/* Modal di pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>
              Completa il pagamento per confermare la tua prenotazione.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {createPaymentIntentMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-yookve-red mb-4" />
                <p>Preparazione del pagamento in corso...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-gray-50 mb-4">
                  <h3 className="font-semibold mb-2">Dettagli della prenotazione:</h3>
                  {selectedBooking && (
                    <div className="space-y-2">
                      <p>
                        <strong>Importo:</strong> €{selectedBooking.totalPrice}
                      </p>
                      <p>
                        <strong>ID Prenotazione:</strong> {selectedBooking.id}
                      </p>
                    </div>
                  )}
                </div>
                
                {isStripeReady && clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      clientSecret={clientSecret}
                      onSuccess={() => {
                        toast({
                          title: "Pagamento completato",
                          description: "Il tuo pagamento è stato elaborato con successo.",
                        });
                        setIsPaymentModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['bookings'] });
                      }}
                      onError={(message) => {
                        toast({
                          title: "Errore nel pagamento",
                          description: message,
                          variant: "destructive",
                        });
                      }}
                    />
                  </Elements>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={createPaymentIntentMutation.isPending}
            >
              Annulla
            </Button>
            {!isStripeReady && (
              <Button
                className="bg-yookve-red hover:bg-red-700"
                onClick={() => createPaymentIntentMutation.mutate(selectedBooking!.id)}
                disabled={createPaymentIntentMutation.isPending}
              >
                Procedi al pagamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}