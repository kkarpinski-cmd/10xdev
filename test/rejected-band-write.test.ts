import { afterEach, describe, expect, it } from "vitest";
import { createBand, getMyBand, listMyBands } from "@/lib/services/bands";
import { removeRowsThisRunCreated } from "./helpers/remove-created-rows";
import { signInFreshUser } from "./helpers/sign-in";

const EMAIL_PREFIX = "rejected-band-write-";
const PASSWORD = "Rejected-Band-Write-Passw0rd!";
const NAME_LENGTH_ERROR = "Band name must be 1\u201380 characters";
const createdUserIds: string[] = [];
const createdBandIds: string[] = [];

afterEach(async () => {
  const bandIds = createdBandIds.splice(0);
  const userIds = createdUserIds.splice(0);
  await removeRowsThisRunCreated({ bandIds, userIds });
});

type SignedInClient = Parameters<typeof listMyBands>[0];

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
    const bandId = await createBand(client, name);
    createdBandIds.push(bandId);
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
    const userA = await signInFreshUser(EMAIL_PREFIX, PASSWORD, createdUserIds);
    const bandAId = await createBand(userA, "Write A");
    createdBandIds.push(bandAId);

    const userB = await signInFreshUser(EMAIL_PREFIX, PASSWORD, createdUserIds);
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
    const user = await signInFreshUser(EMAIL_PREFIX, PASSWORD, createdUserIds);

    await expectNameRejected(user, "");
    await expectNameRejected(user, "   ");
    await expectNameRejected(user, "a".repeat(81));

    const shortId = await createBand(user, "A");
    createdBandIds.push(shortId);
    expect((await getMyBand(user, shortId))?.id).toBe(shortId);

    const longId = await createBand(user, "b".repeat(80));
    createdBandIds.push(longId);
    expect((await getMyBand(user, longId))?.id).toBe(longId);
  });
});
