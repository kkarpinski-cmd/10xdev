import type { APIRoute } from "astro";
import { BAND_NAME_ERROR, createBand } from "@/lib/services/bands";
import { createClient } from "@/lib/supabase";

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const nameField = form.get("name");
  const bandName = typeof nameField === "string" ? nameField : "";

  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return context.redirect(`/dashboard?error=${encodeURIComponent("Supabase is not configured")}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return context.redirect("/auth/signin");
  }

  try {
    const id = await createBand(supabase, bandName);
    return context.redirect(`/bands/${id}`);
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : BAND_NAME_ERROR;
    return context.redirect(`/dashboard?error=${encodeURIComponent(message)}`);
  }
};
