import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import ProfileForm from "@/components/forms/onboarding/ProfileForm"
import styles from "@/styles/onboarding.module.scss"

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <div className={styles.progress}>
                    <div className={`${styles.progressStep} ${styles.complete}`} />
                    <div className={`${styles.progressStep} ${styles.active}`} />
                </div>

                <div className={styles.header}>
                    <h1>Add a bio</h1>
                    <p>Let your teammates know a bit about you. You can always update this later.</p>
                </div>

                <ProfileForm />
            </div>
        </main>
    )
}
