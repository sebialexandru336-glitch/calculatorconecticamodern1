import { supabase } from "@/integrations/supabase/client";
import type { Operatie } from "@/types/operatie";

export async function fetchOperatii(): Promise<Operatie[]> {
  const { data, error } = await supabase
    .from("operatii")
    .select("*")
    .order("denumire");
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    denumire: d.denumire,
    valoare: Number(d.valoare),
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
}

export async function adminVerify(password: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("admin-operatii", {
    body: { action: "verify", password },
  });
  if (error || !data?.success) return false;
  return true;
}

export async function adminAddOperatie(
  password: string,
  denumire: string,
  valoare: number
): Promise<Operatie> {
  const { data, error } = await supabase.functions.invoke("admin-operatii", {
    body: { action: "add", password, data: { denumire, valoare } },
  });
  if (error) throw new Error(error.message || "Eroare server");
  if (!data?.success) throw new Error(data?.error || "Eroare necunoscută");
  return data.data;
}

export async function adminUpdateOperatie(
  password: string,
  id: string,
  denumire: string,
  valoare: number
): Promise<Operatie> {
  const { data, error } = await supabase.functions.invoke("admin-operatii", {
    body: { action: "update", password, data: { id, denumire, valoare } },
  });
  if (error) throw new Error(error.message || "Eroare server");
  if (!data?.success) throw new Error(data?.error || "Eroare necunoscută");
  return data.data;
}

export async function adminDeleteOperatie(
  password: string,
  id: string
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("admin-operatii", {
    body: { action: "delete", password, data: { id } },
  });
  if (error) throw new Error(error.message || "Eroare server");
  if (!data?.success) throw new Error(data?.error || "Eroare necunoscută");
}
