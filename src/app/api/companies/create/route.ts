import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const CreateCompanySchema = z.object({
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
    const parsed = CreateCompanySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", parsed.data.slug)
        .maybeSingle();

    if (existing) {
        return NextResponse.json(
            { error: "That slug is already taken. Please choose another." },
            { status: 409 }
        );
    }

    // Insert company
    const { data: company, error: insertError } = await supabase
        .from("companies")
        .insert({
            owner_id: user.id,
            name: parsed.data.name,
            slug: parsed.data.slug,
            description: parsed.data.description ?? null,
        })
        .select("id, slug")
        .single();

    if (insertError || !company) {
        return NextResponse.json({ error: insertError?.message ?? "Failed to create company" }, { status: 500 });
    }

    // Add owner as a member with role 'owner'
    const { error: memberError } = await supabase
        .from("company_members")
        .insert({
            company_id: company.id,
            user_id: user.id,
            role: "owner",
        });

    if (memberError) {
        // Non-fatal: company was created, membership insert failed — log but don't block
        console.error("Failed to insert company member:", memberError.message);
    }

    return NextResponse.json({ success: true, company }, { status: 201 });
}
