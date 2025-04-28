import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import Logo from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRound, ShoppingCart, ChevronDown } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/" className="mr-8">
                <Logo />
              </Link>
              <nav>
                <ul className="hidden md:flex space-x-6">
                  <li>
                    <Link href="/chi-siamo" className="hover:text-gray-300">Chi siamo</Link>
                  </li>
                  <li className="relative group">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center hover:text-gray-300">
                          Lavora con noi
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem>
                          <Link href="/lavora-con-noi/opportunita">Opportunità di lavoro</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href="/lavora-con-noi/partner">Partner commerciali</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href="/lavora-con-noi/guide">Guide turistiche</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                  <li className="relative group">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center hover:text-gray-300">
                          Eventi
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem>
                          <Link href="/eventi/fiere">Fiere</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href="/eventi/workshop">Workshop</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href="/eventi/webinar">Webinar</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                  <li>
                    <Link href="/contatti" className="hover:text-gray-300">Contatti e supporto</Link>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hover:text-gray-300">
                      <UserRound className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href="/profilo">Il mio profilo</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/preferences">Le mie preferenze</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/results">I miei pacchetti</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/bookings">Le mie prenotazioni</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" className="hover:text-gray-300 p-0">
                    <UserRound className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/carrello" className="hover:text-gray-300">
                <ShoppingCart className="h-5 w-5" />
              </Link>
              <button className="hover:text-gray-300">IT</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-yookve-dark text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-montserrat font-bold text-lg mb-4">Yookve</h3>
              <p className="text-gray-400 text-sm">Yookve è una piattaforma innovativa che propone pacchetti di vacanza personalizzati in base alle preferenze dei viaggiatori.</p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-montserrat font-bold text-lg mb-4">Destinazioni</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Roma</a></li>
                <li><a href="#" className="hover:text-white">Firenze</a></li>
                <li><a href="#" className="hover:text-white">Venezia</a></li>
                <li><a href="#" className="hover:text-white">Milano</a></li>
                <li><a href="#" className="hover:text-white">Costiera Amalfitana</a></li>
                <li><a href="#" className="hover:text-white">Toscana</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-montserrat font-bold text-lg mb-4">Servizi</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Pacchetti personalizzati</a></li>
                <li><a href="#" className="hover:text-white">Esperienze locali</a></li>
                <li><a href="#" className="hover:text-white">Transfer e trasporti</a></li>
                <li><a href="#" className="hover:text-white">Guide turistiche</a></li>
                <li><a href="#" className="hover:text-white">Assistenza viaggiatori</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-montserrat font-bold text-lg mb-4">Contatti</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <i className="fas fa-map-marker-alt w-5"></i> Via Roma 123, Milano
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone w-5"></i> +39 02 1234567
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope w-5"></i> info@yookve.it
                </li>
              </ul>
              <div className="mt-4">
                <h4 className="font-montserrat font-semibold text-sm mb-2">Iscriviti alla newsletter</h4>
                <div className="flex">
                  <input type="email" placeholder="La tua email" className="px-4 py-2 w-full bg-gray-700 text-white rounded-l-md focus:outline-none" />
                  <button className="bg-yookve-red px-4 py-2 rounded-r-md">
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Yookve. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
