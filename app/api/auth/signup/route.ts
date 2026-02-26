import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, password, fullName } = await req.json();

  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";
  const normalizedFullName = typeof fullName === "string" ? fullName.trim() : "";

  if (!normalizedEmail || !normalizedPassword) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: normalizedPassword,
    options: {
      data: {
        full_name: normalizedFullName || null,
      },
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  const needsEmailVerification =
    !data.session ||
    Boolean(data.user?.identities && data.user.identities.length === 0);

  return NextResponse.json({
    success: true,
    needsEmailVerification,
  });
}
