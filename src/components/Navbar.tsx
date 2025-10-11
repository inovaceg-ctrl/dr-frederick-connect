import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gradient">Dr. Frederick</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("home")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Especialidades
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Contato
            </button>
            <Button
              onClick={() => window.location.href = "/auth"}
              className="bg-primary hover:bg-primary-light text-primary-foreground"
            >
              Área do Paciente
            </Button>
            <Button
              onClick={() => window.location.href = "/doctor-login"}
              variant="outline"
              className="border-2 border-secondary hover:border-secondary/80"
            >
              <Shield className="w-4 h-4 mr-2" />
              Área Administrativa
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection("home")}
                className="text-foreground/80 hover:text-foreground transition-colors text-left"
              >
                Início
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-foreground/80 hover:text-foreground transition-colors text-left"
              >
                Sobre
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="text-foreground/80 hover:text-foreground transition-colors text-left"
              >
                Especialidades
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-foreground/80 hover:text-foreground transition-colors text-left"
              >
                Contato
              </button>
              <Button
                onClick={() => window.location.href = "/auth"}
                className="bg-primary hover:bg-primary-light text-primary-foreground w-full"
              >
                Área do Paciente
              </Button>
              <Button
                onClick={() => window.location.href = "/doctor-login"}
                variant="outline"
                className="border-2 border-secondary hover:border-secondary/80 w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Área Administrativa
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
