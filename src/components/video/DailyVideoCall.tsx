import { useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const DailyVideoCall = () => {
  const { user } = useAuth();
  const [isInCall, setIsInCall] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);

  const startCall = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para criar uma videochamada');
      return;
    }
    
    setIsCreating(true);
    try {
      // Gera um nome de sala único usando o ID do usuário e timestamp
      const room = `sala-${user.id.substring(0, 8)}-${Date.now()}`;
      
      // Salva a sessão no banco de dados
      const { error } = await supabase
        .from('video_sessions')
        .insert({
          user_id: user.id,
          room_id: room,
          status: 'scheduled',
        });

      if (error) {
        console.error('Error creating session:', error);
        toast.error('Erro ao criar sessão');
        return;
      }

      setRoomName(room);
      setIsInCall(true);
      toast.success('Sala criada com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao criar videochamada');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Videochamada com Jitsi</CardTitle>
      </CardHeader>
      <CardContent>
        {!isInCall ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Clique no botão abaixo para iniciar uma videochamada gratuita
            </p>
            <Button 
              onClick={startCall}
              disabled={isCreating}
              size="lg"
            >
              {isCreating ? (
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
          </div>
        ) : roomName ? (
          <div className="w-full h-[600px]">
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={roomName}
              configOverwrite={{
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                disableModeratorIndicator: false,
                enableEmailInStats: false,
              }}
              interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_JITSI_WATERMARK: false,
              }}
              userInfo={{
                displayName: user?.email?.split('@')[0] || 'Usuário',
                email: user?.email || '',
              }}
              onApiReady={(externalApi) => {
                console.log('Jitsi API ready');
              }}
              onReadyToClose={() => {
                setIsInCall(false);
                setRoomName(null);
                toast.info('Videochamada encerrada');
              }}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = '600px';
                iframeRef.style.width = '100%';
              }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
