import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  is_from_doctor: boolean;
  created_at: string;
  user_id: string;
}

interface GroupedMessages {
  [userId: string]: Message[];
}

const DoctorChat = () => {
  const { user } = useAuth();
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Erro ao carregar mensagens");
        return;
      }

      const grouped = (data || []).reduce((acc: GroupedMessages, msg: Message) => {
        if (!acc[msg.user_id]) {
          acc[msg.user_id] = [];
        }
        acc[msg.user_id].push(msg);
        return acc;
      }, {});

      setGroupedMessages(grouped);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel("doctor-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setGroupedMessages((prev) => ({
            ...prev,
            [newMsg.user_id]: [...(prev[newMsg.user_id] || []), newMsg],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [groupedMessages, selectedUserId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    const { error } = await supabase.from("messages").insert({
      user_id: selectedUserId,
      content: newMessage,
      is_from_doctor: true,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
      return;
    }

    setNewMessage("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando conversas...</p>
        </CardContent>
      </Card>
    );
  }

  const userIds = Object.keys(groupedMessages);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {userIds.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma conversa ainda</p>
            ) : (
              <div className="space-y-2">
                {userIds.map((userId) => (
                  <Button
                    key={userId}
                    variant={selectedUserId === userId ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedUserId(userId)}
                  >
                    Paciente {userId.slice(0, 8)}...
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedUserId ? `Chat com Paciente` : "Selecione um paciente"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedUserId ? (
            <p className="text-muted-foreground">Selecione um paciente para ver a conversa</p>
          ) : (
            <>
              <ScrollArea className="h-[400px] mb-4" ref={scrollRef}>
                <div className="space-y-4 pr-4">
                  {groupedMessages[selectedUserId]?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.is_from_doctor ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.is_from_doctor
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorChat;
