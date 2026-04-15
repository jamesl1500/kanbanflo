import Image from 'next/image';
import styles from '@/styles/pages/guest.module.scss';

export default function AboutUsPage() {
    return (
        <>
            <section className={styles.hero}>
                <div className={styles.heroSplit}>
                    <div className={styles.heroContent}>
                        <p className={styles.eyebrow}>About Kanflow</p>
                        <h1 className={styles.heroTitle}>
                            A practical operating system for modern delivery teams.
                        </h1>
                        <p className={styles.heroBody}>
                            Kanflow started as an internal workflow playbook: clear ownership, visible
                            priorities, and less time spent translating project status. We turned that playbook
                            into software so teams can move from alignment to execution faster.
                        </p>
                    </div>
                    <div className={styles.heroMedia}>
                        <Image
                            className={styles.heroImage}
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
                            alt="A team collaborating in front of glass planning boards"
                            width={1400}
                            height={900}
                            priority
                        />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>What we believe</h2>
                    <p>Principles that shape every feature decision</p>
                </div>
                <div className={styles.grid}>
                    <article className={styles.card}>
                        <h3>Visibility over vanity metrics</h3>
                        <p>Work should be easy to inspect without forcing teams into performative updates.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Ownership by default</h3>
                        <p>Every task should make accountability explicit from planning to completion.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Tools should reduce noise</h3>
                        <p>Great workflow software creates fewer meetings, fewer pings, and better decisions.</p>
                    </article>
                </div>
            </section>

            <section className={styles.contentBlock}>
                <h2>Who Kanflow is built for</h2>
                <p>
                    Kanflow supports product teams, agencies, and internal operations groups that balance
                    strategic planning with day-to-day execution. If your team values clarity, speed, and
                    accountability, Kanflow is designed to fit how you already work.
                </p>
            </section>

        </>
    );
}
