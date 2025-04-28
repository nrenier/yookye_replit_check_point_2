import { TravelPackage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface TravelCardProps {
  travelPackage: TravelPackage;
}

export default function TravelCard({ travelPackage }: TravelCardProps) {
  const [, navigate] = useLocation();

  const handleViewDetails = () => {
    navigate(`/package/${travelPackage.id}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="relative">
        <img 
          src={travelPackage.imageUrl} 
          alt={travelPackage.title} 
          className="w-full h-48 object-cover" 
        />
        {travelPackage.isRecommended && (
          <div className="absolute top-4 right-4 bg-yookve-red text-white px-3 py-1 rounded-full text-sm font-semibold">
            Consigliato
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-montserrat font-bold text-xl mb-2">{travelPackage.title}</h3>
        <div className="flex items-center mb-4">
          <div className="text-yellow-500 flex">
            {Array.from({ length: 5 }).map((_, index) => {
              const rating = parseFloat(travelPackage.rating || "0");
              if (index < Math.floor(rating)) {
                return <i key={index} className="fas fa-star"></i>;
              } else if (index === Math.floor(rating) && rating % 1 >= 0.5) {
                return <i key={index} className="fas fa-star-half-alt"></i>;
              } else {
                return <i key={index} className="far fa-star"></i>;
              }
            })}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {travelPackage.rating}/5 ({travelPackage.reviewCount} recensioni)
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <i className="fas fa-hotel w-6 text-gray-600"></i>
            <span>{travelPackage.accommodationName} - {travelPackage.destination}</span>
          </div>
          <div className="flex items-center mb-2">
            <i className={`fas ${
              travelPackage.transportType?.includes("Volo") ? "fa-plane-departure" :
              travelPackage.transportType?.includes("Treno") ? "fa-train" :
              travelPackage.transportType?.includes("Auto") ? "fa-car" : "fa-car"
            } w-6 text-gray-600`}></i>
            <span>{travelPackage.transportType}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-calendar-alt w-6 text-gray-600"></i>
            <span>{travelPackage.durationDays} giorni / {travelPackage.durationNights} notti</span>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-montserrat font-semibold text-lg mb-2">Esperienze incluse:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {travelPackage.experiences?.map((experience, index) => (
              <li key={index}>✓ {experience}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-sm text-gray-500">a partire da</p>
            <p className="text-xl font-bold">€{travelPackage.price} <span className="text-sm font-normal">/ persona</span></p>
          </div>
          <Button 
            className="bg-yookve-red hover:bg-red-700"
            onClick={handleViewDetails}
          >
            Vedi Dettagli
          </Button>
        </div>
      </div>
    </div>
  );
}
