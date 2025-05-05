
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import MainLayout from "@/components/layouts/main-layout";
import { getMyPackages } from "@/lib/api";
import TravelCard from "@/components/travel-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function MyPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      // Carica i pacchetti salvati
      const loadMyPackages = async () => {
        try {
          setLoading(true);
          const savedPackages = await getMyPackages();
          setPackages(savedPackages);
          setLoading(false);
        } catch (err) {
          console.error("Errore nel caricamento dei pacchetti:", err);
          setError(err instanceof Error ? err : new Error("Errore sconosciuto"));
          setLoading(false);
        }
      };
      
      loadMyPackages();
    }
  }, [user]);

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-montserrat">I miei pacchetti</CardTitle>
            <CardDescription>
              Qui trovi tutti i pacchetti che hai salvato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
                <p className="ml-4 text-lg">Caricamento pacchetti...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-600">
                <p>Errore durante il caricamento dei pacchetti.</p>
                <p>Dettagli: {error.message}</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Non hai ancora salvato nessun pacchetto.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => (
                  <TravelCard key={pkg.id} travelPackage={pkg} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
