import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import WorkspaceSettingsForm from "@/components/workspaces/WorkspaceSettingsForm";

interface Props {
    params: Promise<{ slug_id: string; workspace_id: string }>;
}

export default async function WorkspaceSettingsPage({ params }: Props) {
    const { slug_id, workspace_id } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", slug_id)
        .maybeSingle();

    if (!company) redirect("/dashboard");

    const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) redirect("/dashboard");

    const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, name, description, status, owner_id")
        .eq("id", workspace_id)
        .eq("company_id", company.id)
        .maybeSingle();

    if (!workspace) redirect(`/companies/s/${slug_id}/workspaces`);

    const canEdit =
        workspace.owner_id === user.id ||
        ["owner", "admin"].includes(membership.role);

    if (!canEdit) redirect(`/companies/s/${slug_id}/workspaces/${workspace_id}`);

    return (
        <WorkspaceSettingsForm
            workspace={{
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                status: workspace.status as 'active' | 'archived',
                owner_id: workspace.owner_id,
            }}
            slug={slug_id}
            isOwner={workspace.owner_id === user.id || membership.role === 'owner'}
        />
    );
}
