import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, MessageSquare, Calendar, Video } from "lucide-react";
import DoctorChat from "@/components/doctor/DoctorChat";
import DoctorAppointments from "@/components/doctor/DoctorAppointments";
import DoctorVideoManager from "@/components/doctor/DoctorVideoManager";

const DoctorArea = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isDoctor, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isDoctor) {
        navigate("/patient-area");
      }
    }
  }, [user, isDoctor, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Área do Médico</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-2" />
              Videochamadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <DoctorChat />
          </TabsContent>

          <TabsContent value="appointments">
            <DoctorAppointments />
          </TabsContent>

          <TabsContent value="video">
            <DoctorVideoManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorArea;
