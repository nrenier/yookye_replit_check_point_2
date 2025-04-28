import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TravelPackage } from "@shared/schema";
import { categories } from "@/data/categories";
import { Loader2 } from "lucide-react";

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  
  const { data: packages, isLoading } = useQuery<TravelPackage[]>({
    queryKey: ["/api/travel-packages/category", activeCategory],
    queryFn: async () => {
      const res = await fetch(`/api/travel-packages/category/${activeCategory}`);
      if (!res.ok) {
        throw new Error("Errore nel caricamento dei pacchetti");
      }
      return res.json();
    }
  });
  
  const activeTabContent = categories.find(cat => cat.id === activeCategory);
  
  return (
    <div className="bg-yookve-red rounded-3xl overflow-hidden">
      <div className="flex flex-wrap">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-button py-4 px-6 text-white font-montserrat font-bold text-center flex-1 min-w-[150px] border-r border-red-600 ${
              activeCategory === category.id ? "active" : ""
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="p-8">
        <p className="text-white text-lg mb-10">{activeTabContent?.description}</p>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages && packages.length > 0 ? (
              packages.slice(0, 3).map((category) => (
                <div key={category.id} className="rounded-2xl overflow-hidden relative group">
                  <img 
                    src={category.imageUrl} 
                    alt={category.title} 
                    className="w-full h-64 object-cover transition duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-6">
                    <h3 className="text-white font-montserrat font-bold text-2xl">{category.title}</h3>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-white">
                <p>Nessuna categoria trovata per questa sezione.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
