import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CompanyProvider } from "@/components/companies/CompanyContext";
import CompanyNav from "@/components/companies/CompanyNav";

interface Props {
    children: React.ReactNode;
    params: Promise<{ slug_id: string }>;
}

export default async function CompanyLayout({ children, params }: Props) {
    const { slug_id } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: company } = await supabase
        .from("companies")
        .select("id, name, slug, description")
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

    return (
        <CompanyProvider
            value={{
                id: company.id,
                name: company.name,
                slug: company.slug,
                description: company.description,
                memberRole: membership.role as 'owner' | 'admin' | 'member',
            }}
        >
            <CompanyNav slug={company.slug} />
            <div style={{ paddingTop: '42px' }}>
                {children}
            </div>
        </CompanyProvider>
    );
}
