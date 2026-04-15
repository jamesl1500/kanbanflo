'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, CheckCircle, Buildings, UserPlus, PencilSimple } from '@phosphor-icons/react';
import styles from '@/styles/shared/headers/header-dropdowns.module.scss';

type ActivityItem = {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    activity_type: string;
};

function formatRelativeTime(input: string): string {
    const timestamp = new Date(input).getTime();
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function getActivityIcon(type: string) {
    if (type.includes('created')) {
        return {
            icon: <CheckCircle size={15} weight="fill" color="#16a34a" />,
            iconBg: '#dcfce7',
        };
    }

    if (type.includes('updated') || type.includes('reordered')) {
        return {
            icon: <PencilSimple size={15} weight="fill" color="#2563eb" />,
            iconBg: '#dbeafe',
        };
    }

    if (type.includes('member') || type.includes('invite')) {
        return {
            icon: <UserPlus size={15} weight="fill" color="#7c3aed" />,
            iconBg: '#ede9fe',
        };
    }

    return {
        icon: <Buildings size={15} weight="fill" color="#d97706" />,
        iconBg: '#fef3c7',
    };
}

export default function ActivityDropdown({
    initialActivity,
}: {
    initialActivity: ActivityItem[];
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.dropdownWrapper} ref={ref}>
            <button
                className={`${styles.iconBtn}${open ? ' ' + styles.active : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label="Activity"
                aria-haspopup="true"
                aria-expanded={open}
            >
                <Clock size={18} weight="regular" />
            </button>

            {open && (
                <div className={styles.dropdown} role="dialog" aria-label="Activity">
                    <div className={styles.dropdownHeader}>
                        <h3>Your Activity</h3>
                    </div>
                    <div className={styles.dropdownList}>
                        {initialActivity.length === 0 ? (
                            <p className={styles.dropdownEmpty}>No activity yet.</p>
                        ) : (
                            initialActivity.map((item) => (
                                <div key={item.id} className={styles.activityItem}>
                                    <div
                                        className={styles.activityIconWrap}
                                        style={{ background: getActivityIcon(item.activity_type).iconBg }}
                                    >
                                        {getActivityIcon(item.activity_type).icon}
                                    </div>
                                    <div className={styles.activityBody}>
                                        <p className={styles.activityText}>
                                            <strong>{item.title}</strong>
                                            {item.description ? ` ${item.description}` : ''}
                                        </p>
                                        <span className={styles.activityTime}>{formatRelativeTime(item.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className={styles.dropdownFooter}>
                        <a href="/activity">View full activity log</a>
                    </div>
                </div>
            )}
        </div>
    );
}
