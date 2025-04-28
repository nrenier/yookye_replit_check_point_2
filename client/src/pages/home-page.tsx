import MainLayout from "@/components/layouts/main-layout";
import HeroSection from "@/components/hero-section";
import CategoryTabs from "@/components/category-tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <HeroSection
        title="Il viaggio perfetto..."
        subtitle="Crea il tuo pacchetto vacanza personalizzato in base alle tue passioni e preferenze"
        ctaLink={user ? "/preferences" : "/auth"}
        ctaText="Inizia Ora"
      />
      
      <section id="preferences" className="py-8">
        <div className="container mx-auto px-4">
          <CategoryTabs />
        </div>
      </section>
      
      {!user && (
        <section className="py-16 bg-yookve-light">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 p-8 md:p-12">
                  <h2 className="font-montserrat font-bold text-3xl mb-6">Crea il tuo account</h2>
                  <p className="mb-8 text-gray-600">Registrati per ricevere pacchetti di vacanza personalizzati in base alle tue preferenze.</p>
                  
                  <div className="space-y-4">
                    <Link href="/auth">
                      <Button className="w-full bg-yookve-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-300">
                        Registrati
                      </Button>
                    </Link>
                    
                    <p className="text-sm text-center text-gray-600">
                      Hai già un account? <Link href="/auth" className="text-yookve-blue hover:underline">Accedi</Link>
                    </p>
                  </div>
                </div>
                
                <div className="md:w-1/2 bg-yookve-dark">
                  <div 
                    className="w-full h-full object-cover bg-center bg-cover"
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=1000&q=80')",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
