import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { recordActivityEvent } from "@/lib/activity/events";

const EditProfileSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(50),
    last_name: z.string().min(1, "Last name is required").max(50),
    user_name: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    bio: z.string().max(280, "Bio must be 280 characters or less").optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = EditProfileSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    // Check username uniqueness (exclude current user)
    if (parsed.data.user_name) {
        const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_name", parsed.data.user_name)
            .neq("id", user.id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: "Username is already taken" },
                { status: 409 }
            );
        }
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            first_name: parsed.data.first_name,
            last_name: parsed.data.last_name,
            user_name: parsed.data.user_name,
            bio: parsed.data.bio ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordActivityEvent(supabase, {
        actorUserId: user.id,
        activityType: "profile.updated",
        title: "Updated profile settings",
        entityType: "profile",
        entityId: user.id,
    });

    return NextResponse.json({ success: true });
}
