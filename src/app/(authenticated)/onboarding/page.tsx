import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export default async function OnboardingIndexPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_status, onboarding_step")
        .eq("id", user.id)
        .single()

    if (!profile || profile.onboarding_status === "pending") {
        redirect("/onboarding/username")
    }

    if (profile.onboarding_status === "in_progress") {
        redirect("/onboarding/profile")
    }

    redirect("/dashboard")
}
