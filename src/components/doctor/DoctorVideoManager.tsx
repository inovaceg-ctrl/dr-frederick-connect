import { useEffect, useState, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, User, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VideoSession {
  id: string;
  user_id: string;
  room_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  appointment_id: string | null;
}

const DoctorVideoManager = () => {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("doctor-video-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_sessions",
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("video_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching video sessions:", error);
      toast.error("Erro ao carregar sessões de vídeo");
      return;
    }

    setSessions(data || []);
    setLoading(false);
  };

  const joinSession = async (session: VideoSession) => {
    if (!containerRef.current) return;

    try {
      // Update session status
      await supabase
        .from("video_sessions")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", session.id);

      const roomUrl = `https://${session.room_id}.daily.co/${session.room_id}`;
      
      const callFrame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '600px',
          border: '0',
          borderRadius: '8px'
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      callFrameRef.current = callFrame;

      callFrame.on('left-meeting', async () => {
        await supabase
          .from("video_sessions")
          .update({ status: "completed", ended_at: new Date().toISOString() })
          .eq("id", session.id);
        
        setActiveSession(null);
        callFrame.destroy();
        callFrameRef.current = null;
        fetchSessions();
      });

      callFrame.on('joined-meeting', () => {
        toast.success("Conectado à videochamada!");
      });

      await callFrame.join({ url: roomUrl });
      setActiveSession(session);
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Erro ao entrar na sessão");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando sessões...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "scheduled":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "scheduled":
        return "Agendada";
      case "completed":
        return "Concluída";
      default:
        return status;
    }
  };

  if (activeSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Videochamada com Paciente {activeSession.user_id.slice(0, 8)}...</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões de Videochamada</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma sessão encontrada</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Paciente: {session.user_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Sala: {session.room_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Criada em:{" "}
                          {format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {session.started_at && (
                        <p className="text-sm text-muted-foreground">
                          Iniciada em:{" "}
                          {format(new Date(session.started_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                      {session.ended_at && (
                        <p className="text-sm text-muted-foreground">
                          Encerrada em:{" "}
                          {format(new Date(session.ended_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 ml-4">
                      <Badge className={getStatusColor(session.status)}>
                        {getStatusLabel(session.status)}
                      </Badge>
                      {session.status === "scheduled" && (
                        <Button
                          size="sm"
                          onClick={() => joinSession(session)}
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Entrar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorVideoManager;
