export function requireLocalSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL;
  if (!value) {
    throw new Error("SUPABASE_URL is required");
  }
  const hostname = new URL(value).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("Teardown must use the local Supabase URL");
  }
  return value;
}
