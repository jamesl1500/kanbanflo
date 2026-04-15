import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: myMemberships, error: myMembershipsError } = await supabase
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", user.id);

    if (myMembershipsError) {
        return NextResponse.json({ error: myMembershipsError.message }, { status: 500 });
    }

    const companyIds = (myMemberships ?? []).map((membership) => membership.company_id);
    if (companyIds.length === 0) {
        return NextResponse.json({ companies: [] });
    }

    const [{ data: companies, error: companiesError }, { data: members, error: membersError }] = await Promise.all([
        supabase
            .from("companies")
            .select("id, slug, name")
            .in("id", companyIds)
            .order("name", { ascending: true }),
        supabase
            .from("company_members")
            .select("company_id, user_id, role")
            .in("company_id", companyIds),
    ]);

    if (companiesError) {
        return NextResponse.json({ error: companiesError.message }, { status: 500 });
    }

    if (membersError) {
        return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const uniqueUserIds = Array.from(new Set((members ?? []).map((member) => member.user_id)));
    const { data: profiles } = uniqueUserIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_name")
            .in("id", uniqueUserIds)
        : { data: [] };

    const profileById = new Map(
        (profiles ?? []).map((profile) => {
            const fullName = `${profile.first_name} ${profile.last_name}`.trim();
            const displayName = fullName || (profile.user_name ? `@${profile.user_name}` : "Unknown user");
            return [profile.id, displayName];
        })
    );

    const myRoleByCompany = new Map((myMemberships ?? []).map((membership) => [membership.company_id, membership.role]));

    const membersByCompany = new Map<string, Array<{ user_id: string; role: string; display_name: string }>>();
    (members ?? []).forEach((member) => {
        if (!membersByCompany.has(member.company_id)) {
            membersByCompany.set(member.company_id, []);
        }

        membersByCompany.get(member.company_id)?.push({
            user_id: member.user_id,
            role: member.role,
            display_name: profileById.get(member.user_id) ?? "Unknown user",
        });
    });

    const payload = (companies ?? []).map((company) => ({
        id: company.id,
        slug: company.slug,
        name: company.name,
        my_role: myRoleByCompany.get(company.id) ?? "member",
        members: (membersByCompany.get(company.id) ?? []).sort((a, b) => a.display_name.localeCompare(b.display_name)),
    }));

    return NextResponse.json({ companies: payload });
}
