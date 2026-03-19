function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[HustleClub] Missing required environment variable: ${name}`);
    }
    console.warn(`[HustleClub] Warning: ${name} is not set`);
    return "";
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock") as "mock" | "stripe" | "razorpay",
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
} as const;
