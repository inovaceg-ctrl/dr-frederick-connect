import { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const DailyVideoCall = () => {
  const { user } = useAuth();
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log('DailyVideoCall component mounted. User:', user?.email);
    console.log('Initial state - isInCall:', isInCall, 'isCreatingRoom:', isCreatingRoom);
    
    return () => {
      console.log('DailyVideoCall component unmounting');
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);

  const resetState = () => {
    console.log('Resetting state...');
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsInCall(false);
    setIsCreatingRoom(false);
    setRoomUrl(null);
    toast.info('Estado resetado');
  };

  const createAndJoinRoom = async () => {
    console.log('createAndJoinRoom called, user:', user);
    
    if (!user) {
      console.error('No user found');
      toast.error('Você precisa estar logado para criar uma videochamada');
      return;
    }
    
    setIsCreatingRoom(true);
    try {
      console.log('Getting session...');
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Session:', session ? 'exists' : 'null');
      
      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      console.log('Invoking create-video-room function...');
      const { data, error } = await supabase.functions.invoke('create-video-room', {
        body: { appointmentId: null },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }

      console.log('Room created:', data);
      setRoomUrl(data.roomUrl);
      await joinRoom(data.roomUrl);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Erro ao criar sala de vídeo');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinRoom = async (url: string) => {
    if (!containerRef.current) return;

    try {
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

      callFrame.on('left-meeting', () => {
        setIsInCall(false);
        setRoomUrl(null);
        callFrame.destroy();
        callFrameRef.current = null;
      });

      callFrame.on('joined-meeting', () => {
        setIsInCall(true);
        toast.success('Conectado à videochamada!');
      });

      await callFrame.join({ url });
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Erro ao entrar na sala');
    }
  };

  const toggleCamera = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Videochamada</CardTitle>
      </CardHeader>
      <CardContent>
        {!isInCall ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Clique no botão abaixo para iniciar uma videochamada
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  console.log('Button clicked!');
                  createAndJoinRoom();
                }} 
                disabled={isCreatingRoom}
                size="lg"
              >
                {isCreatingRoom ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Criando sala...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 mr-2" />
                    Iniciar Videochamada
                  </>
                )}
              </Button>
              <Button 
                onClick={resetState} 
                variant="outline"
                size="lg"
              >
                Resetar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div ref={containerRef} className="w-full" />
            <div className="flex justify-center gap-4">
              <Button
                variant={isCameraOn ? "default" : "destructive"}
                size="icon"
                onClick={toggleCamera}
              >
                {isCameraOn ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant={isMicOn ? "default" : "destructive"}
                size="icon"
                onClick={toggleMic}
              >
                {isMicOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={leaveCall}
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
