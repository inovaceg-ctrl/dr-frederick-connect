import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Edit, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const patientSchema = z.object({
  full_name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional()
});

interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

const DoctorPatients = () => {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    console.log("🔍 Fetching patients...");
    
    // Get all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast.error("Erro ao carregar pacientes");
      setLoading(false);
      return;
    }

    // Get user roles to filter only patients
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      toast.error("Erro ao carregar informações dos pacientes");
      setLoading(false);
      return;
    }

    // Filter profiles to only include patients
    const patientIds = rolesData
      .filter(r => r.role === 'patient')
      .map(r => r.user_id);

    const patientsData = profilesData.filter(p => patientIds.includes(p.id));

    console.log("✅ Patients loaded:", patientsData.length);
    setPatients(patientsData);
    setLoading(false);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validatedData = patientSchema.parse(formData);

      if (!formData.password) {
        toast.error("Senha é obrigatória para novos pacientes");
        return;
      }

      setSubmitting(true);
      console.log("Creating new patient:", validatedData.email);

      const { data, error } = await supabase.functions.invoke('create-patient', {
        body: {
          email: validatedData.email,
          full_name: validatedData.full_name,
          password: formData.password
        }
      });

      if (error) {
        console.error("Error creating patient:", error);
        toast.error(error.message || "Erro ao criar paciente");
        return;
      }

      console.log("Patient created successfully:", data);
      toast.success("Paciente criado com sucesso!");
      
      setFormData({ full_name: "", email: "", password: "" });
      setIsAddDialogOpen(false);
      await fetchPatients();

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error("Unexpected error:", error);
        toast.error("Erro ao criar paciente");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) return;

    try {
      // Validate form data (without password for edit)
      const validatedData = patientSchema.omit({ password: true }).parse(formData);

      setSubmitting(true);
      console.log("Updating patient:", selectedPatient.id);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validatedData.full_name,
          email: validatedData.email
        })
        .eq("id", selectedPatient.id);

      if (error) {
        console.error("Error updating patient:", error);
        toast.error("Erro ao atualizar paciente");
        return;
      }

      console.log("Patient updated successfully");
      toast.success("Paciente atualizado com sucesso!");
      
      setFormData({ full_name: "", email: "", password: "" });
      setSelectedPatient(null);
      setIsEditDialogOpen(false);
      await fetchPatients();

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error("Unexpected error:", error);
        toast.error("Erro ao atualizar paciente");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (patient: Profile) => {
    setSelectedPatient(patient);
    setFormData({
      full_name: patient.full_name,
      email: patient.email,
      password: ""
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Pacientes</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Paciente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Nome Completo *</Label>
                <Input
                  id="add-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome do paciente"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Senha *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ full_name: "", email: "", password: "" });
                    setIsAddDialogOpen(false);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Criando..." : "Criar Paciente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum paciente cadastrado ainda
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {patient.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {patient.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(patient)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditPatient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome do paciente"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                  maxLength={255}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ full_name: "", email: "", password: "" });
                    setSelectedPatient(null);
                    setIsEditDialogOpen(false);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DoctorPatients;