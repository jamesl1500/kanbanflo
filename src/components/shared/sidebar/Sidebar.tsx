import styles from "@/styles/shared/sidebar/sidebar.module.scss";

export default function Sidebar() {
    return (
        <aside className={styles.sidebar}>
            <nav className={styles.sidebarNav}>
                <ul className={styles.sidebarNavList}>
                    <li className={styles.sidebarNavItem}>
                        <a href="/dashboard" className={styles.sidebarNavLink} title="Dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}
