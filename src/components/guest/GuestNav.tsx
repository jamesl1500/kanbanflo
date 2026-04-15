'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import styles from '@/styles/pages/guest.module.scss';

const guestLinks = [
    { href: '/features', label: 'Features' },
    { href: '/about-us', label: 'About us' },
    { href: '/contact-us', label: 'Contact us' },
    { href: '/login', label: 'Log in' },
] as const;

function isActivePath(pathname: string, href: string) {
    if (pathname === href) return true;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(`${href}/`);
}

export default function GuestNav() {
    const pathname = usePathname();

    return (
        <nav className={styles.nav}>
            {guestLinks.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(styles.navLink, active && styles.activeNavLink)}
                        aria-current={active ? 'page' : undefined}
                    >
                        {link.label}
                    </Link>
                );
            })}
            <Link href="/signup" className={cn(styles.navLink, styles.cta)}>
                Start free
            </Link>
        </nav>
    );
}
