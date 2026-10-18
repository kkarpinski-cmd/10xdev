import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createBand, getMyBand, listMyBands } from "@/lib/services/bands";

const PASSWORD = "Own-Band-Read-Passw0rd!";

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function signInFreshUser(): Promise<Parameters<typeof listMyBands>[0]> {
  const client = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const email = `own-band-read-${randomUUID()}@example.com`;

  const signedUp = await client.auth.signUp({ email, password: PASSWORD });
  if (signedUp.error) {
    throw new Error(signedUp.error.message);
  }

  const signedIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signedIn.error) {
    throw new Error(signedIn.error.message);
  }

  return client;
}

describe("own-band read", () => {
  it("does not return another user's band id", async () => {
    const userA = await signInFreshUser();
    const bandAId = await createBand(userA, "Read A");

    const userB = await signInFreshUser();
    const bandBId = await createBand(userB, "Read B");

    const listedIds = (await listMyBands(userB)).map((band) => band.id);
    expect(listedIds).toContain(bandBId);
    expect(listedIds).not.toContain(bandAId);

    expect(await getMyBand(userB, bandAId)).toBeNull();

    const visible = await getMyBand(userA, bandAId);
    expect(visible?.id).toBe(bandAId);
  });
});
