import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, password, data } = await req.json();

    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "naticacasebi12";
    if (!password || password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: "Parolă greșită" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let result;

    switch (action) {
      case "verify": {

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add": {
        const { denumire, valoare } = data;
        if (!denumire || !valoare || Number(valoare) <= 0) {
          return new Response(
            JSON.stringify({ error: "Date invalide" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: inserted, error } = await supabase
          .from("operatii")
          .insert({ denumire: denumire.trim(), valoare: Number(valoare) })
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "update": {
        const { id, denumire, valoare } = data;
        if (!id || !denumire || !valoare || Number(valoare) <= 0) {
          return new Response(
            JSON.stringify({ error: "Date invalide" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: updated, error } = await supabase
          .from("operatii")
          .update({ denumire: denumire.trim(), valoare: Number(valoare) })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = updated;
        break;
      }

      case "delete": {
        const { id } = data;
        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID lipsă" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { error } = await supabase.from("operatii").delete().eq("id", id);
        if (error) throw error;
        result = { deleted: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Acțiune necunoscută" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
