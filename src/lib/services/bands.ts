import type { SupabaseClient } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase";
import type { Band, BandRole } from "@/types";

export const BAND_NAME_ERROR = "Band name must be 1–80 characters";

interface Database {
  public: {
    Tables: {
      bands: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      band_members: {
        Row: {
          band_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          band_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          band_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_band: {
        Args: { band_name: string };
        Returns: string;
      };
    };
  };
}

type ServerSupabase = NonNullable<ReturnType<typeof createClient>>;

function databaseClient(supabase: ServerSupabase): SupabaseClient<Database> {
  return supabase as SupabaseClient<Database>;
}

export async function createBand(supabase: ServerSupabase, bandName: string): Promise<string> {
  const { data, error } = await databaseClient(supabase).rpc("create_band", { band_name: bandName });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

function isBandRole(role: string): role is BandRole {
  return role === "owner" || role === "member";
}

export async function getMyBand(supabase: ServerSupabase, bandId: string): Promise<(Band & { role: BandRole }) | null> {
  const client = databaseClient(supabase);

  const { data: band, error: bandError } = await client
    .from("bands")
    .select("id, name, created_at")
    .eq("id", bandId)
    .maybeSingle();

  if (bandError) {
    throw new Error(bandError.message);
  }
  if (!band) {
    return null;
  }

  const { data: membership, error: membershipError } = await client
    .from("band_members")
    .select("role")
    .eq("band_id", bandId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }
  if (!membership || !isBandRole(membership.role)) {
    return null;
  }

  const createdAt = new Date(band.created_at);
  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return {
    id: band.id,
    name: band.name,
    createdAt: createdAt.toISOString(),
    role: membership.role,
  };
}
