import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import UsernameForm from "@/components/forms/onboarding/UsernameForm"
import styles from "@/styles/onboarding.module.scss"

export default async function UsernamePage() {
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
                    <div className={`${styles.progressStep} ${styles.active}`} />
                    <div className={styles.progressStep} />
                </div>

                <div className={styles.header}>
                    <h1>Choose your username</h1>
                    <p>This is how others will find and mention you across Kanbanflo.</p>
                </div>

                <UsernameForm />
            </div>
        </main>
    )
}
