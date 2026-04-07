import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Buildings } from "@phosphor-icons/react/dist/ssr";
import styles from "@/styles/pages/dashboard.module.scss";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Check if user belongs to any company
    const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    const hasCompany = !!membership;

    return (
        <div className={styles.dashboardPage}>
            <div className={styles.dashboardHeader}>
                <h1>Dashboard</h1>
                <p>Welcome back! Here&apos;s what&apos;s happening.</p>
            </div>

            {!hasCompany && (
                <div className={styles.createCompanyCta}>
                    <div className={styles.ctaIcon}>
                        <Buildings size={32} weight="duotone" />
                    </div>
                    <div className={styles.ctaBody}>
                        <h2>Create your first company</h2>
                        <p>
                            Companies are shared workspaces where you and your team manage tasks,
                            track progress, and stay accountable together.
                        </p>
                        <Link href="/companies/create" className={styles.ctaButton}>
                            Get started
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
