import Image from 'next/image';
import styles from '@/styles/pages/guest.module.scss';

export default function TermsAndConditionsPage() {
    return (
        <>
            <section className={styles.hero}>
                <div className={styles.heroSplit}>
                    <div className={styles.heroContent}>
                        <p className={styles.eyebrow}>Terms and Conditions</p>
                        <h1 className={styles.heroTitle}>The ground rules for using Kanbanflo responsibly.</h1>
                        <p className={styles.heroBody}>
                            These terms explain account responsibilities, acceptable platform use, and service
                            expectations. This is a practical draft and should be reviewed by counsel before
                            production launch.
                        </p>
                    </div>
                    <div className={styles.heroMedia}>
                        <Image
                            className={styles.heroImage}
                            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80"
                            alt="Contract documents and a pen on a desk"
                            width={1400}
                            height={900}
                            priority
                        />
                    </div>
                </div>
            </section>

            <section className={styles.contentBlock}>
                <h2>Use of service</h2>
                <p>
                    You may use Kanbanflo only for lawful business or personal project management. You are
                    responsible for maintaining account security and activity performed under your account.
                </p>
            </section>

            <section className={styles.contentBlock}>
                <h2>Availability and changes</h2>
                <p>
                    We may improve, modify, or discontinue features over time. We work to keep the platform
                    available but do not guarantee uninterrupted service.
                </p>
            </section>

            <section className={styles.contentBlock}>
                <h2>Customer responsibilities</h2>
                <ul>
                    <li>Provide accurate account information and protect authentication credentials.</li>
                    <li>Use Kanbanflo in compliance with local laws and your internal company policies.</li>
                    <li>Avoid abusive behavior, unauthorized access attempts, or service disruption.</li>
                </ul>
            </section>

            <section className={styles.contentBlock}>
                <h2>Termination</h2>
                <p>
                    We may suspend or terminate access for abuse, unlawful activity, or violation of these
                    terms. You may stop using Kanbanflo at any time.
                </p>
            </section>

            <section className={styles.contentBlock}>
                <h2>Contact for legal requests</h2>
                <p>
                    For legal inquiries related to these terms, contact legal@kanbanflo.com with your company
                    details and request context.
                </p>
            </section>
        </>
    );
}
