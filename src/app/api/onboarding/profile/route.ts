import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

const ProfileSchema = z.object({
  bio: z.string().max(280).optional().or(z.literal("")),
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
  const parsed = ProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      bio: parsed.data.bio ?? null,
      onboarding_status: "complete",
      onboarding_step: 2,
    })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ redirect: "/dashboard" })
}
