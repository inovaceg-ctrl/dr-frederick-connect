import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, MessageCircle, Calendar, LogOut, User } from "lucide-react";

const PatientArea = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient">Área do Paciente</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <Button
              variant="outline"
              onClick={signOut}
              className="border-primary/20 hover:border-primary/40"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl font-bold mb-4">
            Bem-vindo à sua <span className="text-gradient">Área do Paciente</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Em breve você terá acesso completo a chat, videochamadas e agendamentos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Chat Direto</CardTitle>
              <CardDescription>
                Converse com o Dr. Frederick por mensagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Videochamada</CardTitle>
              <CardDescription>
                Realize suas sessões de terapia online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Gerencie suas consultas e horários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-12 border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Próximos Passos</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>A funcionalidade de chat será implementada para comunicação em tempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Sistema de videochamadas para sessões de terapia online</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Calendário de agendamentos integrado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Histórico de sessões e evolução do tratamento</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientArea;
