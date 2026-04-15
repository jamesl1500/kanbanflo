import Image from 'next/image';
import styles from '@/styles/pages/guest.module.scss';

export default function PrivacyPolicyPage() {
    return (
        <>
            <section className={styles.hero}>
                <div className={styles.heroSplit}>
                    <div className={styles.heroContent}>
                        <p className={styles.eyebrow}>Privacy Policy</p>
                        <h1 className={styles.heroTitle}>Your workspace data deserves clear protections.</h1>
                        <p className={styles.heroBody}>
                            This policy summarizes what we collect, why we process it, and how we protect it.
                            It is intended as a product-facing draft and should be validated by legal counsel.
                        </p>
                    </div>
                    <div className={styles.heroMedia}>
                        <Image
                            className={styles.heroImage}
                            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80"
                            alt="Cyber security concept with lock and digital interface"
                            width={1400}
                            height={900}
                            priority
                        />
                    </div>
                </div>
            </section>

            <section className={styles.contentBlock}>
                <h2>Information we collect</h2>
                <ul>
                    <li>Account identifiers such as name, email, and profile details.</li>
                    <li>Workspace content such as projects, tasks, comments, and status updates.</li>
                    <li>Usage and diagnostics data to improve reliability and performance.</li>
                </ul>
            </section>

            <section className={styles.contentBlock}>
                <h2>How we use data</h2>
                <p>
                    We use data to deliver the product, authenticate users, improve features, and provide
                    support. We do not sell personal data.
                </p>
            </section>

            <section className={styles.contentBlock}>
                <h2>Security controls</h2>
                <ul>
                    <li>Authentication and access controls for company-bound workspaces.</li>
                    <li>Data storage protections and routine operational monitoring.</li>
                    <li>Role-aware permissions to reduce unauthorized access risk.</li>
                </ul>
            </section>

            <section className={styles.contentBlock}>
                <h2>Your choices</h2>
                <p>
                    You can request correction or deletion of account data where applicable. Contact us through
                    the details below for privacy requests.
                </p>
            </section>

            <section className={styles.contentBlock}>
                <h2>Privacy contact</h2>
                <p>
                    Send privacy requests to privacy@kanbanflo.com and include your account email and request
                    details so we can process quickly.
                </p>
            </section>
        </>
    );
}
