import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const VideoCall = () => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: parar stream quando componente é desmontado
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCall = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCallActive(true);
      toast.success("Videochamada iniciada!");
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Erro ao acessar câmera/microfone. Verifique as permissões.");
    }
    setIsConnecting(false);
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCallActive(false);
    setIsCameraOn(true);
    setIsMicOn(true);
    toast.info("Videochamada encerrada");
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Videochamada</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isCallActive ? (
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center space-y-4">
                <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Clique em "Iniciar Chamada" para começar uma sessão de vídeo
                </p>
                <Button
                  onClick={startCall}
                  disabled={isConnecting}
                  className="bg-primary hover:bg-primary-light"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Iniciar Chamada
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <Button
                    size="icon"
                    variant={isCameraOn ? "secondary" : "destructive"}
                    onClick={toggleCamera}
                    className="rounded-full"
                  >
                    {isCameraOn ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <VideoOff className="w-5 h-5" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant={isMicOn ? "secondary" : "destructive"}
                    onClick={toggleMic}
                    className="rounded-full"
                  >
                    {isMicOn ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <MicOff className="w-5 h-5" />
                    )}
                  </Button>

                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={endCall}
                    className="rounded-full"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">💡 Dica:</p>
                <p className="text-muted-foreground">
                  Esta é uma demonstração básica de videochamada. Em produção, você
                  conectaria com o Dr. Frederick através de um servidor de
                  videochamadas como Jitsi, Daily.co, ou similar.
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
