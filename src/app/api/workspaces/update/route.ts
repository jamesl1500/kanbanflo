import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const UpdateWorkspaceSchema = z.object({
    id: z.string().uuid("Invalid workspace ID"),
    name: z.string().min(1, "Workspace name is required").max(80, "Name must be 80 characters or less"),
    description: z.string().max(300, "Description must be 300 characters or less").optional().or(z.literal("")),
    status: z.enum(["active", "archived"]).optional(),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, name, description, status } = parsed.data;

    // Fetch workspace to check ownership/company membership
    const { data: workspace } = await supabase
        .from("workspaces")
        .select("company_id, owner_id")
        .eq("id", id)
        .maybeSingle();

    if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Must be owner of workspace OR company owner/admin
    const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", workspace.company_id)
        .eq("user_id", user.id)
        .maybeSingle();

    const isOwner = workspace.owner_id === user.id;
    const isCompanyAdmin = membership && ["owner", "admin"].includes(membership.role);

    if (!isOwner && !isCompanyAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
        .from("workspaces")
        .update({
            name,
            description: description ?? null,
            ...(status ? { status } : {}),
        })
        .eq("id", id)
        .select("id, name, status")
        .single();

    if (updateError || !updated) {
        return NextResponse.json({ error: updateError?.message ?? "Failed to update workspace" }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspace: updated });
}
