import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GearSix } from "@phosphor-icons/react/dist/ssr";
import WorkspaceKanbanClientOnly from "@/components/workspaces/WorkspaceKanbanClientOnly";
import styles from "@/styles/pages/companies/workspace-kanban.module.scss";

interface Props {
    params: Promise<{ slug_id: string; workspace_id: string }>;
}

export default async function WorkspaceKanbanPage({ params }: Props) {
    const { slug_id, workspace_id } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Verify company membership
    const { data: company } = await supabase
        .from("companies")
        .select("id, name")
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

    // Fetch workspace
    const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, name, description, status, owner_id")
        .eq("id", workspace_id)
        .eq("company_id", company.id)
        .maybeSingle();

    if (!workspace) redirect(`/companies/s/${slug_id}/workspaces`);

    // Fetch lists ordered by position
    const { data: lists } = await supabase
        .from("kanban_lists")
        .select("id, name, position, color")
        .eq("workspace_id", workspace_id)
        .order("position", { ascending: true });

    // Fetch all cards for this workspace ordered by position
    const { data: cards } = await supabase
        .from("kanban_cards")
        .select("id, list_id, title, description, position, priority, due_date")
        .eq("workspace_id", workspace_id)
        .order("position", { ascending: true });

    const canManageWorkspace =
        workspace.owner_id === user.id ||
        ["owner", "admin"].includes(membership.role);

    const canEditCards = Boolean(membership);

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <h1 className={styles.pageTitle}>{workspace.name}</h1>
                    {workspace.description && (
                        <p className={styles.pageDesc}>{workspace.description}</p>
                    )}
                </div>
                {canManageWorkspace && (
                    <Link
                        href={`/companies/s/${slug_id}/workspaces/${workspace_id}/settings`}
                        className={styles.settingsBtn}
                        title="Workspace settings"
                    >
                        <GearSix size={17} weight="fill" />
                        Settings
                    </Link>
                )}
            </div>

            <WorkspaceKanbanClientOnly
                workspaceId={workspace_id}
                companySlug={slug_id}
                initialLists={lists ?? []}
                initialCards={cards ?? []}
                canEditCards={canEditCards}
                canManageLists={canManageWorkspace}
            />
        </div>
    );
}
