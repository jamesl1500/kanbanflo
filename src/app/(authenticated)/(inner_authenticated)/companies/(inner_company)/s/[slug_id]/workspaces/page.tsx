import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Kanban, Plus, Archive } from "@phosphor-icons/react/dist/ssr";
import styles from "@/styles/pages/companies/workspace-list.module.scss";

interface Props {
    params: Promise<{ slug_id: string }>;
}

export default async function WorkspacesPage({ params }: Props) {
    const { slug_id } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Resolve company from slug
    const { data: company } = await supabase
        .from("companies")
        .select("id, name")
        .eq("slug", slug_id)
        .maybeSingle();

    if (!company) redirect("/dashboard");

    const { data: workspaces } = await supabase
        .from("workspaces")
        .select("id, name, description, status, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

    const active = workspaces?.filter((w) => w.status === "active") ?? [];
    const archived = workspaces?.filter((w) => w.status === "archived") ?? [];

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Workspaces</h1>
                    <p className={styles.pageDesc}>Organize your work into focused Kanban boards.</p>
                </div>
                <Link href={`/companies/s/${slug_id}/workspaces/create`} className={styles.createBtn}>
                    <Plus size={16} weight="bold" />
                    New workspace
                </Link>
            </div>

            {active.length === 0 && archived.length === 0 ? (
                <div className={styles.empty}>
                    <Kanban size={40} weight="thin" className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>No workspaces yet</p>
                    <p className={styles.emptyDesc}>Create your first workspace to start organizing tasks on a Kanban board.</p>
                    <Link href={`/companies/s/${slug_id}/workspaces/create`} className={styles.createBtn}>
                        <Plus size={15} weight="bold" />
                        Create workspace
                    </Link>
                </div>
            ) : (
                <>
                    {active.length > 0 && (
                        <section className={styles.section}>
                            <div className={styles.grid}>
                                {active.map((ws) => (
                                    <Link
                                        key={ws.id}
                                        href={`/companies/s/${slug_id}/workspaces/${ws.id}`}
                                        className={styles.card}
                                    >
                                        <div className={styles.cardIcon}>
                                            <Kanban size={22} weight="fill" />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <p className={styles.cardName}>{ws.name}</p>
                                            {ws.description && (
                                                <p className={styles.cardDesc}>{ws.description}</p>
                                            )}
                                        </div>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.cardDate}>
                                                {new Date(ws.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {archived.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <Archive size={15} weight="fill" />
                                Archived
                            </h2>
                            <div className={styles.grid}>
                                {archived.map((ws) => (
                                    <Link
                                        key={ws.id}
                                        href={`/companies/s/${slug_id}/workspaces/${ws.id}`}
                                        className={`${styles.card} ${styles.cardArchived}`}
                                    >
                                        <div className={styles.cardIcon}>
                                            <Kanban size={22} weight="fill" />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <p className={styles.cardName}>{ws.name}</p>
                                            {ws.description && (
                                                <p className={styles.cardDesc}>{ws.description}</p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
