import { Mail, Phone, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: "E-mail",
      value: "parcerias@drfredmartins.com.br",
      link: "mailto:parcerias@drfredmartins.com.br"
    },
    {
      icon: Phone,
      title: "WhatsApp",
      value: "+55 32 9193-1779",
      link: "https://wa.me/5532919317779"
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@drfredmartinsjf",
      link: "https://instagram.com/drfredmartinsjf"
    }
  ];

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Entre em <span className="text-gradient">Contato</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Estou aqui para ajudar você em sua jornada de autoconhecimento e bem-estar
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactInfo.map((item, index) => (
            <Card
              key={index}
              className="border-none shadow-lg hover:shadow-xl transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.value}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-secondary text-white animate-slide-up">
          <CardContent className="p-8 md:p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Inicie Sua Jornada de Transformação</h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Dê o primeiro passo para uma vida mais equilibrada e significativa. 
              Agende sua consulta online hoje mesmo.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.open("https://wa.me/5532919317779?text=Olá, gostaria de agendar uma consulta", "_blank")}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Agendar no WhatsApp
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = "/auth"}
                className="border-2 border-white text-white hover:bg-white/10"
              >
                Acessar Área do Paciente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Contact;
