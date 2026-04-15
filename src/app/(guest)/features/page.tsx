import Image from 'next/image';
import styles from '@/styles/pages/guest.module.scss';

export default function FeaturesPage() {
    return (
        <>
            <section className={styles.hero}>
                <div className={styles.heroSplit}>
                    <div className={styles.heroContent}>
                        <p className={styles.eyebrow}>Features</p>
                        <h1 className={styles.heroTitle}>
                            Detailed workflow controls without enterprise complexity.
                        </h1>
                        <p className={styles.heroBody}>
                            Kanbanflo combines board-level speed with card-level depth so teams can plan,
                            execute, and report from one cohesive workspace.
                        </p>
                    </div>
                    <div className={styles.heroMedia}>
                        <Image
                            className={styles.heroImage}
                            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80"
                            alt="Project dashboard on a desk with analytics"
                            width={1400}
                            height={900}
                            priority
                        />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Core capabilities</h2>
                    <p>Designed to support planning, delivery, and visibility</p>
                </div>
                <div className={styles.grid}>
                    <article className={styles.card}>
                        <h3>Company workspaces</h3>
                        <p>Segment work by company context and keep access scoped to relevant members.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Kanban workflows</h3>
                        <p>Move cards with drag-and-drop interactions tuned for speed and clarity.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Task detail sidebar</h3>
                        <p>Review fields, subtasks, due dates, and assignment without leaving the board.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Subtask decomposition</h3>
                        <p>Break larger efforts into actionable checkpoints with visual completion progress.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Assignee control</h3>
                        <p>Route responsibility to the right teammate with clear ownership signals.</p>
                    </article>
                    <article className={styles.card}>
                        <h3>Role-aware collaboration</h3>
                        <p>Keep decision-making secure with role-sensitive permissions and controls.</p>
                    </article>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>See Kanflow in real workflows</h2>
                    <p>Examples from product and operations teams</p>
                </div>
                <div className={styles.imageRow}>
                    <article className={styles.mediaCard}>
                        <div className={styles.cardImageWrap}>
                            <Image
                                className={styles.heroImage}
                                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80"
                                alt="Team lead reviewing sprint board with laptop"
                                width={1200}
                                height={740}
                            />
                        </div>
                        <div className={styles.mediaCardBody}>
                            <h3>Product sprint orchestration</h3>
                            <p>
                                Plan backlog movement, assign implementation owners, and monitor sprint risk in
                                one board.
                            </p>
                        </div>
                    </article>
                    <article className={styles.mediaCard}>
                        <div className={styles.cardImageWrap}>
                            <Image
                                className={styles.heroImage}
                                src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1400&q=80"
                                alt="Operations manager checking task statuses on a notebook"
                                width={1200}
                                height={740}
                            />
                        </div>
                        <div className={styles.mediaCardBody}>
                            <h3>Operations reliability loops</h3>
                            <p>
                                Capture incoming work, convert it to prioritized cards, and keep follow-through
                                visible.
                            </p>
                        </div>
                    </article>
                </div>
            </section>
        </>
    );
}
