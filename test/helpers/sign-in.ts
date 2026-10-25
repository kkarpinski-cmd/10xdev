import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { listMyBands } from "@/lib/services/bands";

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export async function signInFreshUser(
  emailPrefix: string,
  password: string,
  createdUserIds: string[],
): Promise<Parameters<typeof listMyBands>[0]> {
  const client = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const email = `${emailPrefix}${randomUUID()}@example.com`;

  const signedUp = await client.auth.signUp({ email, password });
  if (signedUp.error) {
    throw new Error(signedUp.error.message);
  }
  const signedUpUserId = signedUp.data.user?.id;
  if (signedUpUserId) {
    createdUserIds.push(signedUpUserId);
  }

  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    throw new Error(signedIn.error.message);
  }
  const signedInUserId = signedIn.data.user.id;
  if (signedInUserId && signedInUserId !== signedUpUserId) {
    createdUserIds.push(signedInUserId);
  }
  if (!signedUpUserId && !signedInUserId) {
    throw new Error("Signed-up user id is required");
  }

  return client;
}
