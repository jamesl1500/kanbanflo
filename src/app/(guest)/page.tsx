import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/pages/guest.module.scss';

export default function LandingPage() {
    return (
        <>
            <section className={styles.hero}>
                <div className={styles.heroSplit}>
                    <div className={styles.heroContent}>
                        <p className={styles.eyebrow}>Flow over friction</p>
                        <h1 className={styles.heroTitle}>
                            Project operations that feel as clear as your dashboard.
                        </h1>
                        <p className={styles.heroBody}>
                            Kanbanflo helps teams plan, prioritize, and ship work with the same pragmatic
                            visual language used in your authenticated workspace. Keep board details,
                            ownership, and delivery signals connected from kickoff to done.
                        </p>
                        <div className={styles.actions}>
                            <Link href="/signup" className={styles.primaryBtn}>
                                Create your workspace
                            </Link>
                            <Link href="/features" className={styles.secondaryBtn}>
                                Explore features
                            </Link>
                        </div>
                    </div>

                    <div className={styles.heroMedia}>
                        <Image
                            className={styles.heroImage}
                            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"
                            alt="Team collaborating around a project board"
                            width={1400}
                            height={900}
                            priority
                        />
                    </div>
                </div>
            </section>

            <section className={styles.statsRow}>
                <article className={styles.statCard}>
                    <p className={styles.statValue}>3x</p>
                    <p className={styles.statLabel}>faster handoff clarity across teams</p>
                </article>
                <article className={styles.statCard}>
                    <p className={styles.statValue}>42%</p>
                    <p className={styles.statLabel}>fewer status check-in meetings</p>
                </article>
                <article className={styles.statCard}>
                    <p className={styles.statValue}>99.9%</p>
                    <p className={styles.statLabel}>workspace uptime target</p>
                </article>
                <article className={styles.statCard}>
                    <p className={styles.statValue}>24h</p>
                    <p className={styles.statLabel}>average support response window</p>
                </article>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Why teams switch to Kanbanflo</h2>
                    <p>Built for execution, not reporting theater</p>
                </div>
                <div className={styles.grid}>
                    <article className={styles.card}>
                        <h3>Consistent context</h3>
                        <p>
                            Company spaces keep goals, workspaces, and assignments connected across
                            initiatives.
                        </p>
                    </article>
                    <article className={styles.card}>
                        <h3>Actionable detail view</h3>
                        <p>
                            Open a card, edit quickly, and manage subtasks in one place without losing board
                            context.
                        </p>
                    </article>
                    <article className={styles.card}>
                        <h3>Ownership without ambiguity</h3>
                        <p>
                            Assign tasks clearly and track progress by status, due date, and priority signals.
                        </p>
                    </article>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>How teams use Kanbanflo day-to-day</h2>
                    <p>From weekly planning to daily execution</p>
                </div>
                <div className={styles.imageRow}>
                    <article className={styles.mediaCard}>
                        <div className={styles.cardImageWrap}>
                            <Image
                                className={styles.heroImage}
                                src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80"
                                alt="Developer planning tasks on a laptop"
                                width={1200}
                                height={740}
                            />
                        </div>
                        <div className={styles.mediaCardBody}>
                            <h3>Weekly planning rituals</h3>
                            <p>
                                Convert goals into scoped cards with due dates and assignees during planning
                                sessions.
                            </p>
                        </div>
                    </article>
                    <article className={styles.mediaCard}>
                        <div className={styles.cardImageWrap}>
                            <Image
                                className={styles.heroImage}
                                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80"
                                alt="Cross-functional team reviewing project progress"
                                width={1200}
                                height={740}
                            />
                        </div>
                        <div className={styles.mediaCardBody}>
                            <h3>Cross-functional delivery</h3>
                            <p>
                                Keep product, engineering, and operations aligned using shared board visibility.
                            </p>
                        </div>
                    </article>
                </div>
            </section>
        </>
    );
}
