import { Award, BookOpen, Heart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import drFrederickGraduation from "@/assets/dr-frederick-graduation.jpg";

const About = () => {
  const highlights = [
    {
      icon: Award,
      title: "10+ Anos",
      description: "De experiência clínica"
    },
    {
      icon: BookOpen,
      title: "Doutor",
      description: "Em Psicanálise"
    },
    {
      icon: Heart,
      title: "1.1M+",
      description: "Seguidores no Instagram"
    },
    {
      icon: Sparkles,
      title: "TV Nacional",
      description: "Band TV e Rede TV"
    }
  ];

  return (
    <section id="about" className="py-24 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Sobre <span className="text-gradient">Dr. Frederick</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Uma jornada dedicada ao bem-estar emocional e transformação de vidas
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6 animate-slide-up">
            <p className="text-lg leading-relaxed">
              Dr. Frederick Parreira é terapeuta, mestre e doutor em psicanálise, além de sexólogo e espiritualista. 
              Com uma abordagem única e carismática, ele combina saúde mental com conteúdos dinâmicos e divertidos, 
              criando uma conexão profunda com seu público.
            </p>
            <p className="text-lg leading-relaxed">
              Seu conteúdo oferece um equilíbrio entre insights emocionais e leveza, permitindo que os seguidores 
              se identifiquem com temas de autoconhecimento e entretenimento. Dr. Frederick não só transforma vidas 
              através de suas consultas terapêuticas, mas também se tornou uma figura de destaque no universo digital.
            </p>
            <p className="text-lg leading-relaxed">
              Sua capacidade de abordar temas complexos de forma acessível o diferencia como influenciador e profissional, 
              ampliando sua influência nas redes sociais e além.
            </p>
          </div>

          <div className="relative animate-fade-in">
            <img
              src={drFrederickGraduation}
              alt="Dr. Frederick Parreira - Formação"
              className="rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {highlights.map((item, index) => (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow animate-slide-up">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/50 animate-slide-up">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-6">Formação Acadêmica</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">Psicanálise</h4>
                <p className="text-muted-foreground">
                  Graduação pela Faculdade Elevo de Brasília (DF), com especialização em Psicoterapia Psicanalítica, 
                  mestrado e doutorado pelo Instituto Oráculo de São Paulo
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Especializações</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Especialista em Sexologia</li>
                  <li>Pós-graduação em Saúde Mental com foco em Prescrição Farmacêutica</li>
                  <li>Formação em Psicologia Social da Imagem pela USP</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default About;
