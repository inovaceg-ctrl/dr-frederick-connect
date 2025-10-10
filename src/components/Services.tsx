import { Brain, Heart, Users, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Services = () => {
  const services = [
    {
      icon: Brain,
      title: "Psicanálise",
      description: "Terapia psicanalítica profunda para autoconhecimento e compreensão dos processos inconscientes que influenciam suas emoções e comportamentos."
    },
    {
      icon: Heart,
      title: "Sexologia",
      description: "Abordagem especializada em questões relacionadas à sexualidade, intimidade e relacionamentos, em um ambiente seguro e sem julgamentos."
    },
    {
      icon: Users,
      title: "Terapia de Casais",
      description: "Auxílio para casais em conflito, promovendo comunicação saudável e fortalecimento de vínculos afetivos através de técnicas comprovadas."
    },
    {
      icon: Video,
      title: "Terapia Online",
      description: "Sessões de terapia por videochamada com a mesma qualidade e confidencialidade das consultas presenciais, com horários flexíveis."
    }
  ];

  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Especialidades e <span className="text-gradient">Serviços</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Atendimento personalizado com foco no seu bem-estar emocional e desenvolvimento pessoal
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card
              key={index}
              className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-8 md:p-12 animate-slide-up">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">Impacto Digital e Mídia</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Em 2024, Dr. Frederick se dedicou ao quadro <strong>Intensamente</strong> no programa Fama & Destaque, 
              e também participou da Rede TV ao lado do apresentador Liqueri. Foi contratado pela Band TV para a 
              terceira temporada da série <strong>Jovens Sonhadores</strong>, com estreia prevista para abril de 2025.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-background rounded-lg px-6 py-3 shadow-md">
                <p className="font-semibold">Prêmio Miss Influencer</p>
              </div>
              <div className="bg-background rounded-lg px-6 py-3 shadow-md">
                <p className="font-semibold">Destaque do Ano</p>
              </div>
              <div className="bg-background rounded-lg px-6 py-3 shadow-md">
                <p className="font-semibold">Grupo Vantagem JF</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
