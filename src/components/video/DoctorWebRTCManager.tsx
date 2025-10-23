import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

interface VideoSession {
  id: string;
  user_id: string;
  room_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  appointment_id: string | null;
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  ice_candidates: RTCIceCandidateInit[];
}

export const DoctorWebRTCManager = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

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
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const fetchSessions = async () => {
    console.log('🔍 Doctor fetching video sessions...');
    console.log('Current user:', user?.id);
    
    const { data, error } = await supabase
      .from("video_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching video sessions:", error);
      toast.error("Erro ao carregar sessões de vídeo");
      return;
    }

    console.log('✅ Video sessions fetched:', data?.length || 0, 'sessions');
    console.log('Sessions data:', data);
    
    const scheduledSessions = data?.filter(s => s.status === 'scheduled') || [];
    console.log('📋 Scheduled sessions available:', scheduledSessions.length);

    setSessions((data || []) as unknown as VideoSession[]);
    setLoading(false);
  };

  const joinSession = async (session: VideoSession) => {
    try {
      if (!session.offer) {
        toast.error('Aguardando paciente criar oferta...');
        return;
      }

      // IMPORTANTE: Mostrar a tela de vídeo ANTES de obter câmera
      // para que os elementos existam quando setarmos srcObject
      setActiveSession(session);
      toast.success('Entrando na videochamada!');
      
      // Aguardar próximo frame para garantir que os elementos foram renderizados
      await new Promise(resolve => setTimeout(resolve, 100));

      // Obter stream local
      console.log('🎥 Doctor requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      
      console.log('✅ Doctor camera access granted!');
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        console.log('📹 Setting doctor local video srcObject...');
        localVideoRef.current.srcObject = stream;
        
        // Try to play immediately
        try {
          await localVideoRef.current.play();
          console.log('✅ Doctor local video playing');
        } catch (playError) {
          console.error('❌ Error playing doctor local video immediately:', playError);
          
          // Fallback: wait for loadedmetadata
          localVideoRef.current.onloadedmetadata = async () => {
            try {
              await localVideoRef.current?.play();
              console.log('✅ Doctor local video playing after metadata loaded');
            } catch (e) {
              console.error('❌ Error playing doctor local video after metadata:', e);
            }
          };
        }
      } else {
        console.error('❌ Doctor localVideoRef.current is null!');
      }

      // Criar peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Adicionar tracks locais
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Lidar com stream remoto
      pc.ontrack = async (event) => {
        console.log('🎬 Doctor received remote track:', event.track.kind);
        console.log('Remote stream:', event.streams[0]);
        
        if (remoteVideoRef.current && event.streams[0]) {
          console.log('📹 Setting doctor remote video srcObject...');
          remoteVideoRef.current.srcObject = event.streams[0];
          
          // Try to play immediately
          try {
            await remoteVideoRef.current.play();
            console.log('✅ Doctor remote video playing');
          } catch (playError) {
            console.error('❌ Error playing doctor remote video immediately:', playError);
            
            // Fallback: wait for loadedmetadata
            remoteVideoRef.current.onloadedmetadata = async () => {
              try {
                await remoteVideoRef.current?.play();
                console.log('✅ Doctor remote video playing after metadata loaded');
              } catch (e) {
                console.error('❌ Error playing doctor remote video after metadata:', e);
              }
            };
          }
        }
      };

      // Lidar com candidatos ICE
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          
          const { data: sessionData } = await supabase
            .from('video_sessions')
            .select('ice_candidates')
            .eq('id', session.id)
            .single();

          if (sessionData) {
            const candidates = (sessionData.ice_candidates as RTCIceCandidateInit[]) || [];
            candidates.push(event.candidate.toJSON());
            
            await supabase
              .from('video_sessions')
              .update({ ice_candidates: candidates as any })
              .eq('id', session.id);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          toast.success('Conectado ao paciente!');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          toast.error('Conexão perdida');
          handleEndCall();
        }
      };

      // Configurar descrição remota (oferta do paciente)
      await pc.setRemoteDescription(new RTCSessionDescription(session.offer));

      // Processar candidatos ICE existentes
      if (session.ice_candidates) {
        for (const candidate of session.ice_candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Added ICE candidate');
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      }

      // Criar resposta
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Salvar resposta no banco
      await supabase
        .from('video_sessions')
        .update({ 
          answer: answer as any,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', session.id);

      // Configurar listener para novos candidatos ICE do paciente
      const channel = supabase
        .channel(`session-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'video_sessions',
            filter: `id=eq.${session.id}`
          },
          async (payload) => {
            const newData = payload.new as any;
            
            if (newData.ice_candidates) {
              const candidates = newData.ice_candidates as any[];
              for (const candidate of candidates) {
                if (candidate && pc.remoteDescription) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                  } catch (e) {
                    console.error('Error adding ICE candidate:', e);
                  }
                }
              }
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
      
    } catch (error: any) {
      console.error('❌ Error joining session:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permissão de câmera/microfone negada. Por favor, permita o acesso.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Câmera ou microfone não encontrados.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Câmera ou microfone já estão em uso.');
      } else {
        toast.error('Erro ao entrar na chamada: ' + error.message);
      }
      
      // Se houver erro, voltar ao estado inicial
      setActiveSession(null);
      cleanup();
    }
  };

  const handleEndCall = async () => {
    if (activeSession) {
      await supabase
        .from("video_sessions")
        .update({ 
          status: "completed", 
          ended_at: new Date().toISOString() 
        })
        .eq("id", activeSession.id);
    }
    
    cleanup();
    setActiveSession(null);
    fetchSessions();
    toast.info('Videochamada encerrada');
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 bg-black rounded-lg object-cover transform scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  Você
                </div>
              </div>
              <div className="relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  Paciente
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                variant={isCameraOn ? "default" : "destructive"}
                size="icon"
                onClick={toggleCamera}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isMicOn ? "default" : "destructive"}
                size="icon"
                onClick={toggleMic}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões de Videochamada WebRTC</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">Nenhuma sessão encontrada</p>
            <p className="text-sm text-muted-foreground">
              Aguardando pacientes iniciarem videochamadas...
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Total de sessões: {sessions.length} | 
              Aguardando: {sessions.filter(s => s.status === 'scheduled' && s.offer).length}
            </p>
            <div className="space-y-4">
              {sessions.map((session) => {
                console.log('Rendering session:', {
                  id: session.id,
                  status: session.status,
                  hasOffer: !!session.offer,
                  canJoin: session.status === "scheduled" && !!session.offer
                });
                
                return (
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
                          {!session.offer && session.status === "scheduled" && (
                            <p className="text-xs text-muted-foreground">
                              Aguardando oferta...
                            </p>
                          )}
                          {session.status === "scheduled" && session.offer && (
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
            );
          })}
        </div>
      </>
      )}
      </CardContent>
    </Card>
  );
};

export default DoctorWebRTCManager;