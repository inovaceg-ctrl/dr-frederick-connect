import { Button } from "@/components/ui/button";
import { Instagram, MessageCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import drFrederickProfile from "@/assets/dr-frederick-profile.jpg";

const Hero = () => {
  const navigate = useNavigate();
  
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-slide-up">
            <div className="inline-block px-4 py-2 bg-secondary/10 rounded-full text-secondary font-medium">
              Terapeuta • Psicanalista • Sexólogo
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Dr. Frederick <span className="text-gradient">Parreira</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Transformando vidas através da psicanálise e terapia online. 
              Mais de 10 anos de experiência clínica com uma abordagem única e carismática.
            </p>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Instagram className="w-5 h-5" />
              <span className="font-medium">+1.1M seguidores</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={scrollToContact}
                size="lg"
                className="bg-primary hover:bg-primary-light text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                Agendar Consulta
              </Button>
              <Button
                onClick={() => window.open("https://wa.me/5532919317779", "_blank")}
                size="lg"
                variant="outline"
                className="border-2 border-primary/20 hover:border-primary/40"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={() => navigate("/doctor-area")}
                size="lg"
                variant="outline"
                className="border-2 border-secondary/20 hover:border-secondary/40"
              >
                <Shield className="w-5 h-5 mr-2" />
                Área Administrativa
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl -z-10" />
            <img
              src={drFrederickProfile}
              alt="Dr. Frederick Parreira"
              className="rounded-3xl shadow-2xl w-full max-w-md mx-auto lg:max-w-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
