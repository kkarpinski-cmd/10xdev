import { createClient } from "@supabase/supabase-js";
import { expect } from "vitest";
import { requireLocalSupabaseUrl } from "./local-supabase-url";

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
        Relationships: [
          {
            foreignKeyName: "band_members_band_id_fkey";
            columns: ["band_id"];
            isOneToOne: false;
            referencedRelation: "bands";
            referencedColumns: ["id"];
          },
        ];
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

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function serviceRoleClient() {
  requireLocalSupabaseUrl();
  return createClient<Database>(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function throwOnError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeRowsThisRunCreated(created: {
  bandIds: readonly string[];
  userIds: readonly string[];
}): Promise<void> {
  const admin = serviceRoleClient();
  const bandIds = [...new Set(created.bandIds)];
  const userIds = [...new Set(created.userIds)];

  // band_members has no ON DELETE CASCADE to bands or auth.users. PostgREST rejects an empty `in` list.
  if (bandIds.length > 0) {
    const deletedMembers = await admin.from("band_members").delete().in("band_id", bandIds);
    throwOnError(deletedMembers.error);

    const deletedBands = await admin.from("bands").delete().in("id", bandIds);
    throwOnError(deletedBands.error);
  }

  for (const userId of userIds) {
    const deletedUser = await admin.auth.admin.deleteUser(userId);
    throwOnError(deletedUser.error);
  }

  if (bandIds.length > 0) {
    const remainingBands = await admin.from("bands").select("id").in("id", bandIds);
    throwOnError(remainingBands.error);
    expect(remainingBands.data).toEqual([]);
  }

  for (const userId of userIds) {
    const lookedUp = await admin.auth.admin.getUserById(userId);
    expect(lookedUp.data.user).toBeNull();
  }
}
