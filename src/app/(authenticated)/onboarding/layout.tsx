import styles from "@/styles/onboarding.module.scss"

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={styles.layout}>
            <nav className={styles.nav}>
                <span>KanFlow</span>
                <p>Setting up your account</p>
            </nav>
            {children}
        </div>
    )
}
