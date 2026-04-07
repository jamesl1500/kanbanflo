import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreateWorkspaceForm from "@/components/workspaces/CreateWorkspaceForm";

interface Props {
    params: Promise<{ slug_id: string }>;
}

export default async function CreateWorkspacePage({ params }: Props) {
    const { slug_id } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: company } = await supabase
        .from("companies")
        .select("id, name")
        .eq("slug", slug_id)
        .maybeSingle();

    if (!company) redirect("/dashboard");

    // Verify membership
    const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) redirect("/dashboard");

    return <CreateWorkspaceForm companyId={company.id} slug={slug_id} />;
}
