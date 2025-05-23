import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="mr-8">
                <img src="https://yookye.com/wp-content/uploads/2023/12/Logo-yookye.svg" alt="Yookye" className="h-8" />
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link href="/chi-siamo" className="text-gray-700 hover:text-[#FF385C] font-medium">Come funziona</Link>
                <Link href="/destinations" className="text-gray-700 hover:text-[#FF385C] font-medium">Destinazioni</Link>
                <Link href="/contatti" className="text-gray-700 hover:text-[#FF385C] font-medium">Contatti</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-6">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-700 hover:text-[#FF385C]">
                      <UserRound className="h-6 w-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <Link href="/profilo" className="w-full">Il mio profilo</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/preferences" className="w-full">Le mie preferenze</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/results" className="w-full">I miei pacchetti</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/bookings" className="w-full">Le mie prenotazioni</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" className="text-gray-700 hover:text-[#FF385C]">
                    <UserRound className="h-6 w-6" />
                  </Button>
                </Link>
              )}
              <Link href="/carrello" className="text-gray-700 hover:text-[#FF385C]">
                <ShoppingCart className="h-6 w-6" />
              </Link>
              <button className="text-gray-700 hover:text-[#FF385C] font-medium">IT</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#F8F8F8] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="https://yookye.com/wp-content/uploads/2023/12/Logo-yookye.svg" alt="Yookye" className="h-8 mb-6" />
              <p className="text-gray-600 text-sm">Yookye è la piattaforma che ti permette di organizzare viaggi su misura in modo semplice e veloce.</p>
              <div className="mt-6 flex space-x-4">
                <a href="https://www.facebook.com/yookye" target="_blank" className="text-gray-400 hover:text-[#FF385C]">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/yookye" target="_blank" className="text-gray-400 hover:text-[#FF385C]">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://www.linkedin.com/company/yookye" target="_blank" className="text-gray-400 hover:text-[#FF385C]">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Scopri</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-[#FF385C]">Come funziona</a></li>
                <li><a href="#" className="hover:text-[#FF385C]">Destinazioni</a></li>
                <li><a href="#" className="hover:text-[#FF385C]">FAQ</a></li>
                <li><a href="#" className="hover:text-[#FF385C]">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Azienda</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-[#FF385C]">Chi siamo</a></li>
                <li><a href="#" className="hover:text-[#FF385C]">Lavora con noi</a></li>
                <li><a href="#" className="hover:text-[#FF385C]">Contatti</a></li>
                <li><a href="#" className="hover:text-[#FF385C]">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Newsletter</h3>
              <p className="text-gray-600 mb-4">Iscriviti alla nostra newsletter per ricevere offerte esclusive</p>
              <div className="flex">
                <input type="email" placeholder="La tua email" className="px-4 py-2 w-full border border-gray-300 rounded-l-md focus:outline-none focus:border-[#FF385C]" />
                <button className="bg-[#FF385C] text-white px-4 py-2 rounded-r-md hover:bg-[#E0314F] transition-colors">
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Yookye. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;