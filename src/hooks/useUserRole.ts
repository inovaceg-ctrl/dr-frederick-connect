import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "doctor" | "patient" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        console.log("useUserRole: No user found");
        setRole(null);
        setLoading(false);
        return;
      }

      console.log("useUserRole: Fetching role for user:", user.id);

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("useUserRole: Error fetching user role:", error);
          setRole(null);
        } else if (!data) {
          console.log("useUserRole: No role found for user, defaulting to patient");
          setRole("patient");
        } else {
          console.log("useUserRole: Role found:", data.role);
          setRole(data.role as UserRole);
        }
      } catch (error) {
        console.error("useUserRole: Exception:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, loading, isDoctor: role === "doctor", isPatient: role === "patient" };
};
