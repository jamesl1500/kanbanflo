import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import MessagesPageClient from "@/components/messages/MessagesPageClient";

export default async function MessagesPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    return <MessagesPageClient currentUserId={user.id} />;
}
