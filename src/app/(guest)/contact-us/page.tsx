import Image from 'next/image';
import styles from '@/styles/pages/guest.module.scss';

export default function ContactUsPage() {
    return (
        <>
            <section className={styles.hero}>
                <div className={styles.heroSplit}>
                    <div className={styles.heroContent}>
                        <p className={styles.eyebrow}>Contact us</p>
                        <h1 className={styles.heroTitle}>Let us help your team move faster.</h1>
                        <p className={styles.heroBody}>
                            Whether you need onboarding help, pricing details, or technical support, we are
                            ready to jump in. Share context and we can direct you to the right team quickly.
                        </p>
                    </div>
                    <div className={styles.heroMedia}>
                        <Image
                            className={styles.heroImage}
                            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
                            alt="Support team collaborating in front of laptops"
                            width={1400}
                            height={900}
                            priority
                        />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Direct channels</h2>
                    <p>Pick the route that fits your request</p>
                </div>
                <div className={styles.contactGrid}>
                    <article className={styles.contactCard}>
                    <h3>Email</h3>
                    <a href="mailto:support@kanflow.app">support@kanflow.app</a>
                    </article>
                    <article className={styles.contactCard}>
                    <h3>Sales</h3>
                    <a href="mailto:sales@kanflow.app">sales@kanflow.app</a>
                    </article>
                    <article className={styles.contactCard}>
                    <h3>Partnerships</h3>
                    <a href="mailto:partners@kanflow.app">partners@kanflow.app</a>
                    </article>
                </div>
            </section>

            <section className={styles.contentBlock}>
                <h2>Response times</h2>
                <p>
                    We typically respond within one business day. Include your workspace URL and a short
                    summary so we can help faster.
                </p>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>What to include in your message</h2>
                    <p>Helps us resolve requests faster</p>
                </div>
                <div className={styles.grid}>
                    <article className={styles.card}>
                        <h3>Workspace context</h3>
                        <p>Share your workspace or company slug so we can locate the right environment.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Expected outcome</h3>
                        <p>Tell us what success looks like so we can tailor recommendations.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Timeline and urgency</h3>
                        <p>Include delivery deadlines if your request is tied to a launch or client milestone.</p>
                    </article>
                </div>
            </section>
        </>
    );
}
