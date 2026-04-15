import Link from 'next/link';
import GuestNav from '@/components/guest/GuestNav';
import styles from '@/styles/pages/guest.module.scss';

export default function GuestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const year = new Date().getFullYear();

    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <div className={styles.navWrap}>
                    <Link href="/" className={styles.brand}>
                        <span className={styles.brandMark} aria-hidden="true" />
                        <span>Kanbanflo</span>
                    </Link>

                    <GuestNav />
                </div>
            </header>

            <main className={styles.main}>{children}</main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerTop}>
                        <section className={styles.footerBrandCol}>
                            <Link href="/" className={styles.footerBrand}>
                                <span className={styles.brandMark} aria-hidden="true" />
                                <span>Kanbanflo</span>
                            </Link>
                            <p>
                                Project clarity for modern teams. Plan confidently, assign ownership, and ship
                                work without the noise.
                            </p>
                        </section>

                        <section className={styles.footerCol}>
                            <h3>Product</h3>
                            <div className={styles.footerLinks}>
                                <Link href="/features">Features</Link>
                                <Link href="/about-us">About us</Link>
                                <Link href="/signup">Get started</Link>
                                <Link href="/login">Log in</Link>
                            </div>
                        </section>

                        <section className={styles.footerCol}>
                            <h3>Resources</h3>
                            <div className={styles.footerLinks}>
                                <Link href="/contact-us">Contact us</Link>
                                <a href="mailto:support@kanbanflo.com">support@kanbanflo.com</a>
                                <a href="mailto:sales@kanbanflo.com">sales@kanbanflo.com</a>
                            </div>
                        </section>

                        <section className={styles.footerCol}>
                            <h3>Legal</h3>
                            <div className={styles.footerLinks}>
                                <Link href="/terms-and-conditions">Terms and conditions</Link>
                                <Link href="/privacy-policy">Privacy policy</Link>
                            </div>
                        </section>
                    </div>

                    <div className={styles.footerBottom}>
                        <p>© {year} Kanbanflo. All rights reserved.</p>
                        <div className={styles.footerBottomLinks}>
                            <a href="mailto:privacy@kanbanflo.com">privacy@kanbanflo.com</a>
                            <a href="mailto:legal@kanbanflo.com">legal@kanbanflo.com</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
