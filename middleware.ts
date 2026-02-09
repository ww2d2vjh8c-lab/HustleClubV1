import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return req.cookies.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options: CookieOptions
        ): void {
          res.cookies.set({ name, value, ...options });
        },
        remove(
          name: string,
          options: CookieOptions
        ): void {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 🔑 REQUIRED: sync auth cookies for Server Components
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};