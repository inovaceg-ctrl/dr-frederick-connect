import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Implementação futura com Lovable Cloud
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Implementação futura com Lovable Cloud
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao site
        </Button>

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">
              <span className="text-gradient">Área do Paciente</span>
            </CardTitle>
            <CardDescription>
              Acesse sua conta para iniciar suas sessões de terapia online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="login-password" className="text-sm font-medium">
                      Senha
                    </label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-light"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Esqueceu sua senha?{" "}
                    <a href="#" className="text-primary hover:underline">
                      Recuperar senha
                    </a>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signup-name" className="text-sm font-medium">
                      Nome completo
                    </label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-medium">
                      Senha
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-confirm" className="text-sm font-medium">
                      Confirmar senha
                    </label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-light"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Ao criar uma conta, você concorda com nossos{" "}
                    <a href="#" className="text-primary hover:underline">
                      Termos de Serviço
                    </a>{" "}
                    e{" "}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          A área do paciente estará totalmente funcional em breve com chat, vídeo e áudio
        </p>
      </div>
    </div>
  );
};

export default Auth;
