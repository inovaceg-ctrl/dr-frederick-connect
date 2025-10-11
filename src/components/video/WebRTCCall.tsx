import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Servidores STUN/TURN públicos gratuitos do Google
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const WebRTCCall = () => {
  const { user, loading } = useAuth();
  const [isInCall, setIsInCall] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    return () => {
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

  const setupPeerConnection = async (roomId: string, isOfferer: boolean) => {
    try {
      // Obter stream local
      console.log('Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('Camera access granted. Tracks:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      localStreamRef.current = stream;
    // Set local video stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      console.log("Local video stream set:", stream.getTracks());
      
      // Ensure video plays
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current?.play().catch(e => console.error("Error playing local video:", e));
      };
    }

      // Criar peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Adicionar tracks locais
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Lidar com stream remoto
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log('Remote video stream set');
          
          // Ensure remote video plays
          remoteVideoRef.current.onloadedmetadata = () => {
            remoteVideoRef.current?.play().catch(e => console.error("Error playing remote video:", e));
          };
        }
      };

      // Lidar com candidatos ICE
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          
          // Adicionar candidato ao banco
          const { data: session } = await supabase
            .from('video_sessions')
            .select('ice_candidates')
            .eq('room_id', roomId)
            .single();

          if (session) {
            const candidates = (session.ice_candidates as RTCIceCandidateInit[]) || [];
            candidates.push(event.candidate.toJSON());
            
            await supabase
              .from('video_sessions')
              .update({ ice_candidates: candidates as any })
              .eq('room_id', roomId);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          toast.success('Conectado ao peer!');
          setIsInCall(true);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          toast.error('Conexão perdida');
          handleEndCall();
        }
      };

      return pc;
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      toast.error('Erro ao acessar câmera/microfone');
      throw error;
    }
  };

  const startCall = async () => {
    if (!user) {
      console.error('User not available:', user);
      toast.error('Você precisa estar logado');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Starting call for user:', user.id);
      const room = `room-${user.id.substring(0, 8)}-${Date.now()}`;
      
      // Criar sessão no banco
      const { data: session, error } = await supabase
        .from('video_sessions')
        .insert({
          user_id: user.id,
          room_id: room,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Session created:', session);

      setSessionId(session.id);

      // Configurar peer connection
      const pc = await setupPeerConnection(room, true);

      // Criar oferta
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Salvar oferta no banco
      await supabase
        .from('video_sessions')
        .update({ offer: offer as any })
        .eq('id', session.id);

      // Configurar listener para resposta
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
            console.log('Session updated:', payload);
            
            const newData = payload.new as any;
            
            // Processar resposta
            if (newData.answer && pc.remoteDescription === null) {
              console.log('Received answer, setting remote description');
              await pc.setRemoteDescription(new RTCSessionDescription(newData.answer));
            }

            // Processar candidatos ICE
            if (newData.ice_candidates) {
              const candidates = newData.ice_candidates as any[];
              for (const candidate of candidates) {
                if (candidate && pc.remoteDescription) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('Added ICE candidate');
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
      toast.success('Aguardando médico entrar...');
      
    } catch (error: any) {
      console.error('Error starting call:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao criar chamada: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndCall = async () => {
    if (sessionId) {
      await supabase
        .from('video_sessions')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }
    
    cleanup();
    setIsInCall(false);
    setSessionId(null);
    toast.info('Chamada encerrada');
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Videochamada WebRTC</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : !isInCall && !isCreating ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Conexão direta peer-to-peer sem custos
            </p>
            <Button onClick={startCall} size="lg" disabled={!user}>
              <Video className="h-5 w-5 mr-2" />
              Iniciar Videochamada
            </Button>
          </div>
        ) : isCreating ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="text-muted-foreground">Configurando chamada...</p>
          </div>
        ) : (
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
                  Médico
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
        )}
      </CardContent>
    </Card>
  );
};