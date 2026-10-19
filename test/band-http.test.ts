// Cookie requests against a preview that is already running (`npm run preview`).
// `npm test` leaves this file out. Run it with: npm run test:http
// When preview is not on port 4321: BASE_URL=http://localhost:4322 npm run test:http

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it } from "vitest";
import { requireLocalSupabaseUrl } from "./helpers/local-supabase-url";
import { removeRowsThisRunCreated } from "./helpers/remove-created-rows";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const PASSWORD = "Band-Http-Passw0rd!";
const NAME_LENGTH_ERROR = "Band name must be 1\u201380 characters";
const BAND_PATH = /^\/bands\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const createdEmails: string[] = [];
const createdBandIds: string[] = [];

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function storeCookies(jar: Map<string, string>, response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((attr) => /max-age=0/i.test(attr.trim()));
    if (expired) {
      jar.delete(name.trim());
    } else {
      jar.set(name.trim(), rest.join("="));
    }
  }
}

async function request(
  jar: Map<string, string>,
  path: string,
  options: { method?: string; form?: Record<string, string> } = {},
): Promise<{ status: number; location: string }> {
  const form = options.form;
  const headers: Record<string, string> = {
    Cookie: cookieHeader(jar),
    Origin: BASE_URL,
  };
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  const response = await fetch(BASE_URL + path, {
    method: options.method ?? "GET",
    redirect: "manual",
    headers,
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  storeCookies(jar, response);
  return { status: response.status, location: response.headers.get("location") ?? "" };
}

function locationUrl(location: string): URL {
  if (location === "") {
    throw new Error("location header is required");
  }
  return new URL(location, BASE_URL);
}

function bandIdFromLocation(location: string): string | null {
  if (location === "") {
    return null;
  }
  const match = BAND_PATH.exec(locationUrl(location).pathname);
  if (!match) {
    return null;
  }
  return match[1];
}

async function userIdsForEmails(url: string, emails: readonly string[]): Promise<string[]> {
  if (emails.length === 0) {
    return [];
  }
  const admin = createClient(url, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const wanted = new Set(emails);
  const ids: string[] = [];
  const perPage = 200;
  for (let page = 1; page <= 50 && wanted.size > 0; page += 1) {
    const listed = await admin.auth.admin.listUsers({ page, perPage });
    if (listed.error) {
      throw new Error(listed.error.message);
    }
    for (const user of listed.data.users) {
      if (user.email !== undefined && wanted.has(user.email)) {
        ids.push(user.id);
        wanted.delete(user.email);
      }
    }
    if (listed.data.users.length < perPage) {
      break;
    }
  }
  if (wanted.size > 0) {
    throw new Error("Signed-up user id is required");
  }
  return ids;
}

async function signInThroughApp(jar: Map<string, string>, email: string): Promise<void> {
  const signedUp = await request(jar, "/api/auth/signup", {
    method: "POST",
    form: { email, password: PASSWORD },
  });
  if (
    signedUp.status === 302 &&
    signedUp.location !== "" &&
    locationUrl(signedUp.location).pathname === "/auth/confirm-email"
  ) {
    createdEmails.push(email);
  }
  expect(signedUp.status).toBe(302);
  expect(locationUrl(signedUp.location).pathname).toBe("/auth/confirm-email");

  const signedIn = await request(jar, "/api/auth/signin", {
    method: "POST",
    form: { email, password: PASSWORD },
  });
  expect(signedIn.status).toBe(302);
  expect(locationUrl(signedIn.location).pathname).toBe("/");
}

afterEach(async () => {
  const bandIds = createdBandIds.splice(0);
  const emails = createdEmails.splice(0);
  const url = requireLocalSupabaseUrl();
  const userIds = await userIdsForEmails(url, emails);
  await removeRowsThisRunCreated({ bandIds, userIds });
}, 20_000);

describe("band http", () => {
  it("maps another user's band to 404 and a rejected name to the dashboard error", async () => {
    const jarA = new Map<string, string>();
    const jarB = new Map<string, string>();

    await signInThroughApp(jarA, `band-http-${randomUUID()}@example.com`);
    await signInThroughApp(jarB, `band-http-${randomUUID()}@example.com`);

    const created = await request(jarA, "/api/bands", { method: "POST", form: { name: "HTTP A" } });
    const createdId = bandIdFromLocation(created.location);
    if (createdId) {
      createdBandIds.push(createdId);
    }
    expect(created.status).toBe(302);
    if (!createdId) {
      throw new Error("band id is required");
    }

    const hidden = await request(jarB, `/bands/${createdId}`);
    expect(hidden.status).toBe(404);

    const rejected = await request(jarB, "/api/bands", {
      method: "POST",
      form: { name: "a".repeat(81) },
    });
    const rejectedId = bandIdFromLocation(rejected.location);
    if (rejectedId) {
      createdBandIds.push(rejectedId);
    }
    expect(rejected.status).toBe(302);
    const rejectedUrl = locationUrl(rejected.location);
    expect(rejectedUrl.pathname).toBe("/dashboard");
    const error = rejectedUrl.searchParams.get("error");
    if (error === null) {
      throw new Error("error query is required");
    }
    expect(error).toContain(NAME_LENGTH_ERROR);
  }, 20_000);
});
