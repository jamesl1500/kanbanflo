import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const CreateWorkspaceSchema = z.object({
    company_id: z.string().uuid("Invalid company ID"),
    name: z.string().min(1, "Workspace name is required").max(80, "Name must be 80 characters or less"),
    description: z.string().max(300, "Description must be 300 characters or less").optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Verify user is a member of the company
    const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", parsed.data.company_id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: workspace, error: insertError } = await supabase
        .from("workspaces")
        .insert({
            company_id: parsed.data.company_id,
            owner_id: user.id,
            name: parsed.data.name,
            description: parsed.data.description ?? null,
        })
        .select("id, name")
        .single();

    if (insertError || !workspace) {
        return NextResponse.json({ error: insertError?.message ?? "Failed to create workspace" }, { status: 500 });
    }

    return NextResponse.json({ success: true, workspace }, { status: 201 });
}
