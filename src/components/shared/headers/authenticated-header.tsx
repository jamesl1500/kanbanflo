import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import styles from "@/styles/shared/headers/authenticated-header.module.scss";
import Link from "next/link";
import UserDropdown from "@/components/shared/headers/UserDropdown";
import NotificationsDropdown from "@/components/shared/headers/NotificationsDropdown";
import ActivityDropdown from "@/components/shared/headers/ActivityDropdown";
import MessagesDropdown from "@/components/shared/headers/MessagesDropdown";

export default async function AuthenticatedHeader() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    let firstName = "";
    let lastName = "";
    let avatarUrl: string | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_id")
            .eq("id", user.id)
            .single();

        if (profile) {
            firstName = profile.first_name ?? "";
            lastName = profile.last_name ?? "";

            if (profile.avatar_id) {
                const { data: file } = await supabase
                    .from("files")
                    .select("file_bucket, file_folder, file_name")
                    .eq("id", profile.avatar_id)
                    .single();

                if (file?.file_bucket && file?.file_folder && file?.file_name) {
                    const path = `${file.file_folder}/${file.file_name}`;
                    const { data: urlData } = supabase.storage.from(file.file_bucket).getPublicUrl(path);
                    avatarUrl = urlData.publicUrl ?? null;
                }
            }
        }
    }

    return (
        <header className={styles.authenticated_header}>
            <div className={styles.authenticated_header_brand}>
                <Link href="/dashboard" className={styles.authenticated_header_brand_logo}>
                    <span className={styles.authenticated_header_brand_logo}>Kanflow</span>
                </Link>
            </div>
            <div className={styles.authenticated_header_center}>
                <NotificationsDropdown />
                <ActivityDropdown />
                <MessagesDropdown />
            </div>
            <UserDropdown firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} />
        </header>
    );
}