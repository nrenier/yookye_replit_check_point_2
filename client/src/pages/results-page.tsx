import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import TravelCard from "@/components/travel-card";
import { TravelPackage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function ResultsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: recommendations, isLoading, error } = useQuery<TravelPackage[]>({
    queryKey: ["/api/recommendations"],
  });

  useEffect(() => {
    if (error) {
      // If error is a 404 (no preferences found), redirect to preferences page
      if ((error as any).message?.includes("404")) {
        setLocation("/preferences");
      }
    }
  }, [error, setLocation]);

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <MainLayout>
      <section className="py-16 bg-yookve-light">
        <div className="container mx-auto px-4">
          <h2 className="font-montserrat font-bold text-3xl mb-2 text-center">Le tue proposte personalizzate</h2>
          <p className="text-center text-gray-600 mb-10">
            Ecco tre pacchetti su misura per te in base alle tue preferenze
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-yookve-red" />
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendations.map((travelPackage) => (
                <TravelCard key={travelPackage.id} travelPackage={travelPackage} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Nessuna proposta trovata. Prova a modificare le tue preferenze.</p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
