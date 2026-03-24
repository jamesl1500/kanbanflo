import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return <>{children}</>
}
