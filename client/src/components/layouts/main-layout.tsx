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
      <header className="bg-yookve-red border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="mr-8">
                <img
                  src="/static/LogoYookye.png"
                  alt="Yookye"
                  className="h-8"
                />
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link
                  href="/chi-siamo"
                  className="text-white/80 hover:text-white font-medium"
                >
                  Come funziona
                </Link>
                <Link
                  href="/destinations"
                  className="text-white/80 hover:text-white font-medium"
                >
                  Destinazioni
                </Link>
                <Link
                  href="/contatti"
                  className="text-white/80 hover:text-white font-medium"
                >
                  Contatti
                </Link>
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
                      <Link href="/profilo" className="w-full">
                        Il mio profilo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/preferences" className="w-full">
                        Le mie preferenze
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/results" className="w-full">
                        I miei pacchetti
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/bookings" className="w-full">
                        Le mie prenotazioni
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-[#FF385C]"
                  >
                    <UserRound className="h-6 w-6" />
                  </Button>
                </Link>
              )}
              <Link
                href="/carrello"
                className="text-gray-700 hover:text-[#FF385C]"
              >
                <ShoppingCart className="h-6 w-6" />
              </Link>
              <button className="text-gray-700 hover:text-[#FF385C] font-medium">
                IT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-yookve-red py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img
                src="https://yookye.com/wp-content/uploads/2023/12/Logo-yookye.svg"
                alt="Yookye"
                className="h-8 mb-6"
              />
              <p className="text-white/80 text-sm">
                Yookye è la piattaforma che ti permette di organizzare viaggi su
                misura in modo semplice e veloce.
              </p>
              <div className="mt-6 flex space-x-4">
                <a
                  href="https://www.facebook.com/yookye"
                  target="_blank"
                  className="text-white/80 hover:text-white"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="https://www.instagram.com/yookye"
                  target="_blank"
                  className="text-white/80 hover:text-white"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a
                  href="https://www.linkedin.com/company/yookye"
                  target="_blank"
                  className="text-white/80 hover:text-white"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Scopri</h3>
              <ul className="space-y-3 text-white/80">
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Come funziona
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Destinazioni
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Azienda</h3>
              <ul className="space-y-3 text-white/80">
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Chi siamo
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Lavora con noi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Contatti
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Newsletter</h3>
              <p className="text-white/80 mb-4">
                Iscriviti alla nostra newsletter per ricevere offerte esclusive
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="La tua email"
                  className="px-4 py-2 w-full border border-gray-300 rounded-l-md focus:outline-none focus:border-[#FF385C]"
                />
                <button className="bg-white text-[#FF385C] px-4 py-2 rounded-r-md hover:bg-gray-100 transition-colors">
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-white/80">
            <p>
              © {new Date().getFullYear()} Yookye. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
```