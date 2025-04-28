import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

export default function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundImage = "https://images.unsplash.com/photo-1533600538509-0e654439bee6?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&h=600&q=80"
}: HeroSectionProps) {
  return (
    <section className="relative">
      <div className="w-full h-[500px] lg:h-[600px] overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>
      <div className="absolute top-1/2 left-8 md:left-16 transform -translate-y-1/2 text-white max-w-xl">
        <h1 className="font-montserrat font-bold text-4xl md:text-5xl mb-4">{title}</h1>
        <p className="text-lg md:text-xl mb-8">{subtitle}</p>
        <Link href={ctaLink}>
          <Button size="lg" className="bg-yookve-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg">
            {ctaText}
          </Button>
        </Link>
      </div>
    </section>
  );
}
