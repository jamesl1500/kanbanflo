import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent } from "@/lib/activity/events";

const UpdateCompanySchema = z.object({
    id: z.string().uuid("Invalid company ID"),
    name: z.string().min(2, "Company name must be at least 2 characters").max(80, "Company name must be 80 characters or less"),
    slug: z
        .string()
        .min(2, "Slug must be at least 2 characters")
        .max(50, "Slug must be 50 characters or less")
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
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
    const parsed = UpdateCompanySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { id, name, slug, description } = parsed.data;

    // Verify the current user is the owner or admin of this company
    const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check slug uniqueness, excluding the current company
    const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json(
            { error: "That slug is already taken. Please choose another." },
            { status: 409 }
        );
    }

    const { data: updated, error: updateError } = await supabase
        .from("companies")
        .update({
            name,
            slug,
            description: description ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, slug")
        .single();

    if (updateError || !updated) {
        return NextResponse.json(
            { error: updateError?.message ?? "Failed to update company" },
            { status: 500 }
        );
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: "company.updated",
        title: `Updated company settings for \"${name}\"`,
        entityType: "company",
        entityId: updated.id,
        companyId: updated.id,
    });

    return NextResponse.json({ success: true, company: updated });
}
