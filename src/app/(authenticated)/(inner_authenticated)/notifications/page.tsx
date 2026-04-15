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

export default async function NotificationsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: notifications } = await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at, notification_type")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>Notifications</h1>
                <p>Updates where your access, ownership, or responsibilities were directly affected.</p>
            </header>

            {!notifications || notifications.length === 0 ? (
                <div className={styles.empty}>No notifications yet.</div>
            ) : (
                <div className={styles.list}>
                    {notifications.map((item) => (
                        <article
                            key={item.id}
                            className={`${styles.item}${item.is_read ? "" : ` ${styles.itemUnread}`}`}
                        >
                            <div className={styles.titleRow}>
                                <h2 className={styles.title}>{item.title}</h2>
                                <span className={styles.time}>{formatDate(item.created_at)}</span>
                            </div>
                            {item.body && <p className={styles.body}>{item.body}</p>}
                            <div className={styles.meta}>Type: {item.notification_type}</div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
