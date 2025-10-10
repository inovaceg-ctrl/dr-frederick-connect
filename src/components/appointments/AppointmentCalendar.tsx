import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

export const AppointmentCalendar = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Erro ao carregar agendamentos");
      } else {
        setAppointments(data || []);
      }
    };

    fetchAppointments();
  }, [user]);

  const availableTimes = [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  const createAppointment = async () => {
    if (!selectedDate || !selectedTime || !user) {
      toast.error("Selecione data e horário");
      return;
    }

    setLoading(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        appointment_date: appointmentDate.toISOString(),
        duration_minutes: 60,
        status: "pending",
        notes: notes || null,
      })
      .select();

    if (error) {
      console.error("Error creating appointment:", error);
      toast.error("Erro ao criar agendamento");
    } else {
      toast.success("Agendamento criado com sucesso!");
      setAppointments([...appointments, data[0]]);
      setOpen(false);
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
    }

    setLoading(false);
  };

  const appointmentDates = appointments.map((apt) =>
    new Date(apt.appointment_date).toDateString()
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agendar Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
            locale={ptBR}
            className="rounded-md border"
            modifiers={{
              booked: (date) => appointmentDates.includes(date.toDateString()),
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "hsl(var(--primary))",
                color: "white",
                fontWeight: "bold",
              },
            }}
          />

          {selectedDate && (
            <div className="mt-6 space-y-4">
              <div>
                <Label>Horário disponível</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva brevemente o motivo da consulta..."
                  rows={3}
                />
              </div>

              <Button
                onClick={createAppointment}
                disabled={!selectedTime || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarIcon className="w-4 h-4 mr-2" />
                )}
                Confirmar Agendamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum agendamento ainda
              </p>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {format(
                          new Date(appointment.appointment_date),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        appointment.status === "confirmed" &&
                          "bg-green-100 text-green-800",
                        appointment.status === "pending" &&
                          "bg-yellow-100 text-yellow-800",
                        appointment.status === "cancelled" &&
                          "bg-red-100 text-red-800"
                      )}
                    >
                      {appointment.status === "confirmed" && "Confirmado"}
                      {appointment.status === "pending" && "Pendente"}
                      {appointment.status === "cancelled" && "Cancelado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(new Date(appointment.appointment_date), "HH:mm")} -{" "}
                      {appointment.duration_minutes} minutos
                    </span>
                  </div>
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {appointment.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
