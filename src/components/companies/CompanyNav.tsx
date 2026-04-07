'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Kanban, CheckSquare, Users, GearSix } from '@phosphor-icons/react';
import styles from '@/styles/shared/company-nav.module.scss';

interface CompanyNavProps {
    slug: string;
}

const NAV_ITEMS = [
    { label: 'Workspaces', path: 'workspaces', icon: <Kanban size={15} weight="fill" /> },
    { label: 'Tasks',      path: 'tasks',      icon: <CheckSquare size={15} weight="fill" /> },
    { label: 'Members',    path: 'members',    icon: <Users size={15} weight="fill" /> },
    { label: 'Settings',   path: 'settings',   icon: <GearSix size={15} weight="fill" /> },
];

export default function CompanyNav({ slug }: CompanyNavProps) {
    const pathname = usePathname();
    const base = `/companies/s/${slug}`;

    return (
        <nav className={styles.companyNav} aria-label="Company navigation">
            <div className={styles.companyNavInner}>
                {NAV_ITEMS.map(({ label, path, icon }) => {
                    const href = `${base}/${path}`;
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <Link
                            key={path}
                            href={href}
                            className={`${styles.navItem}${isActive ? ' ' + styles.navItemActive : ''}`}
                        >
                            {icon}
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
