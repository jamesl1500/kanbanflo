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
                    <li className={styles.sidebarNavItem}>
                        <a href="/notifications" className={styles.sidebarNavLink} title="Notifications">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .738-1.674C19.41 13.847 18 11.684 18 8a6 6 0 1 0-12 0c0 3.684-1.411 5.847-2.738 7.326" />
                            </svg>
                        </a>
                    </li>
                    <li className={styles.sidebarNavItem}>
                        <a href="/activity" className={styles.sidebarNavLink} title="Activity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </a>
                    </li>
                    <li className={styles.sidebarNavItem}>
                        <a href="/messages" className={styles.sidebarNavLink} title="Messages">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}
