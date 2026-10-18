import { afterEach, describe, expect, it } from "vitest";
import { createBand, getMyBand, listMyBands } from "@/lib/services/bands";
import { removeRowsThisRunCreated } from "./helpers/remove-created-rows";
import { signInFreshUser } from "./helpers/sign-in";

const EMAIL_PREFIX = "own-band-read-";
const PASSWORD = "Own-Band-Read-Passw0rd!";
const createdUserIds: string[] = [];
const createdBandIds: string[] = [];

afterEach(async () => {
  const bandIds = createdBandIds.splice(0);
  const userIds = createdUserIds.splice(0);
  await removeRowsThisRunCreated({ bandIds, userIds });
});

describe("own-band read", () => {
  it("does not return another user's band id", async () => {
    const userA = await signInFreshUser(EMAIL_PREFIX, PASSWORD, createdUserIds);
    const bandAId = await createBand(userA, "Read A");
    createdBandIds.push(bandAId);

    const userB = await signInFreshUser(EMAIL_PREFIX, PASSWORD, createdUserIds);
    const bandBId = await createBand(userB, "Read B");
    createdBandIds.push(bandBId);

    const listedIds = (await listMyBands(userB)).map((band) => band.id);
    expect(listedIds).toContain(bandBId);
    expect(listedIds).not.toContain(bandAId);

    expect(await getMyBand(userB, bandAId)).toBeNull();

    const visible = await getMyBand(userA, bandAId);
    expect(visible?.id).toBe(bandAId);
  });
});
