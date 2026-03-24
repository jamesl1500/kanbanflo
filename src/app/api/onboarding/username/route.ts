import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

const UsernameSchema = z.object({
  userName: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
})

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = UsernameSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { userName } = parsed.data

  // Check username availability
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_name", userName)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      user_name: userName,
      onboarding_status: "in_progress",
      onboarding_step: 1,
    })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ redirect: "/onboarding/profile" })
}
