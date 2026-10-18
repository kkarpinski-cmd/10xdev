import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createBand, getMyBand, listMyBands } from "@/lib/services/bands";

const PASSWORD = "Rejected-Band-Write-Passw0rd!";
const NAME_LENGTH_ERROR = "Band name must be 1\u201380 characters";

type SignedInClient = Parameters<typeof listMyBands>[0];

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function signInFreshUser(): Promise<SignedInClient> {
  const client = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const email = `rejected-band-write-${randomUUID()}@example.com`;

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

async function signedInUserId(client: SignedInClient): Promise<string> {
  const currentUser = await client.auth.getUser();
  if (currentUser.error) {
    throw new Error(currentUser.error.message);
  }
  return currentUser.data.user.id;
}

async function expectNameRejected(client: SignedInClient, name: string): Promise<void> {
  const idsBefore = (await listMyBands(client)).map((band) => band.id);

  let thrown: unknown = undefined;
  try {
    await createBand(client, name);
  } catch (error: unknown) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(Error);
  if (!(thrown instanceof Error)) {
    return;
  }
  expect(thrown.message).toContain(NAME_LENGTH_ERROR);

  const idsAfter = (await listMyBands(client)).map((band) => band.id);
  const addedIds = idsAfter.filter((id) => !idsBefore.includes(id));
  expect(addedIds).toHaveLength(0);
}

describe("rejected band write", () => {
  it("does not keep an owner membership written by another user", async () => {
    const userA = await signInFreshUser();
    const bandAId = await createBand(userA, "Write A");

    const userB = await signInFreshUser();
    const userBId = await signedInUserId(userB);

    await userB.from("band_members").insert({
      band_id: bandAId,
      user_id: userBId,
      role: "owner",
    });
    await userB.from("band_members").update({ role: "owner" }).eq("band_id", bandAId);

    const visibleToA = await getMyBand(userA, bandAId);
    expect(visibleToA?.role).toBe("owner");
    expect(await getMyBand(userB, bandAId)).toBeNull();
  });

  it("rejects names outside 1–80 characters and accepts the edges", async () => {
    const user = await signInFreshUser();

    await expectNameRejected(user, "");
    await expectNameRejected(user, "   ");
    await expectNameRejected(user, "a".repeat(81));

    const shortId = await createBand(user, "A");
    expect((await getMyBand(user, shortId))?.id).toBe(shortId);

    const longId = await createBand(user, "b".repeat(80));
    expect((await getMyBand(user, longId))?.id).toBe(longId);
  });
});
