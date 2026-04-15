import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "@/styles/pages/notifications-activity.module.scss";

function formatDate(value: string): string {
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default async function ActivityPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: activity } = await supabase
        .from("activity_events")
        .select("id, title, description, created_at, activity_type")
        .eq("actor_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>Your Activity</h1>
                <p>A running history of actions you performed across companies and workspaces.</p>
            </header>

            {!activity || activity.length === 0 ? (
                <div className={styles.empty}>No activity yet.</div>
            ) : (
                <div className={styles.list}>
                    {activity.map((item) => (
                        <article key={item.id} className={styles.item}>
                            <div className={styles.titleRow}>
                                <h2 className={styles.title}>{item.title}</h2>
                                <span className={styles.time}>{formatDate(item.created_at)}</span>
                            </div>
                            {item.description && <p className={styles.body}>{item.description}</p>}
                            <div className={styles.meta}>Type: {item.activity_type}</div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
