// Smoke test: proves the built app, the Cloudflare adapter and the Supabase auth flow still work together.
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(response) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired) jar.delete(name.trim());
    else jar.set(name.trim(), rest.join("="));
  }
}

async function request(path, { method = "GET", form } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(),
      Origin: BASE_URL,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  storeCookies(response);
  return { status: response.status, location: response.headers.get("location") ?? "" };
}

const BAND_LOCATION = /^\/bands\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let nightShiftLocation = "";

const steps = [
  ["home renders", () => request("/"), { status: 200 }],
  ["dashboard redirects anonymous user", () => request("/dashboard"), { status: 302, location: "/auth/signin" }],
  [
    "create band redirects anonymous user",
    () => request("/api/bands", { method: "POST", form: { name: "Night Shift" } }),
    { status: 302, location: "/auth/signin" },
  ],
  [
    "signup creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/auth/confirm-email" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong" } }),
    { status: 302, location: "/auth/signin?error=" },
  ],
  [
    "signin accepts correct password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/" },
  ],
  [
    "create Night Shift",
    async () => {
      const created = await request("/api/bands", { method: "POST", form: { name: "Night Shift" } });
      nightShiftLocation = created.location;
      return created;
    },
    { status: 302, locationPattern: BAND_LOCATION, follow: true },
  ],
  [
    "create second Night Shift",
    () => request("/api/bands", { method: "POST", form: { name: "Night Shift" } }),
    { status: 302, locationPattern: BAND_LOCATION, follow: true, distinctFrom: () => nightShiftLocation },
  ],
  ["dashboard renders for signed-in user", () => request("/dashboard"), { status: 200 }],
  ["signout clears session", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  ["dashboard redirects after signout", () => request("/dashboard"), { status: 302, location: "/auth/signin" }],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  const locationOk = expected.locationPattern
    ? expected.locationPattern.test(actual.location)
    : expected.location === undefined || actual.location.startsWith(expected.location);
  const distinctOk = expected.distinctFrom === undefined || actual.location !== expected.distinctFrom();
  let followDetail = "";
  let followOk = true;
  if (expected.follow && locationOk) {
    const page = await request(actual.location);
    followDetail = ` ; GET ${page.status}`;
    followOk = page.status === 200;
  } else if (expected.follow) {
    followOk = false;
  }
  const ok = actual.status === expected.status && locationOk && distinctOk && followOk;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}${followDetail}`);
  if (!ok) {
    failed++;
    const expectedLocation = expected.locationPattern ? expected.locationPattern : (expected.location ?? "");
    const distinctNote = expected.distinctFrom && !distinctOk ? " (location must differ)" : "";
    const followNote = expected.follow ? " ; GET 200" : "";
    console.log(`      expected ${expected.status} ${expectedLocation}${followNote}${distinctNote}`);
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
