import AuthenticatedHeader from "@/components/shared/headers/authenticated-header";
import Sidebar from "@/components/shared/sidebar/Sidebar";
import styles from "@/styles/layouts/inner_authenticated.module.scss";

export default function InnerAuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const year = new Date().getFullYear();

    return (
        <div className={styles.innerAuthenticatedContainer}>
            <AuthenticatedHeader />
            <div className={styles.innerAuthenticatedBody}>
                <Sidebar />
                <main className={styles.innerAuthenticatedContent}>
                    {children}
                    <footer className={styles.appFooter}>
                        <p>
                            © {year} Kanbanflo. Created by{' '}
                            <a href="https://www.lattentechnologies.com" target="_blank" rel="noreferrer">
                                Latten Technologies, LLC
                            </a>
                            .
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
}