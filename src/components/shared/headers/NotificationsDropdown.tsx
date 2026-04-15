'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle, UserPlus, Buildings } from '@phosphor-icons/react';
import styles from '@/styles/shared/headers/header-dropdowns.module.scss';

type NotificationItem = {
    id: string;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
    notification_type: string;
};

function formatRelativeTime(input: string): string {
    const timestamp = new Date(input).getTime();
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function getNotificationIcon(type: string) {
    if (type.includes('member')) {
        return {
            icon: <UserPlus size={16} weight="fill" color="#2563eb" />,
            iconBg: '#dbeafe',
        };
    }

    if (type.includes('task')) {
        return {
            icon: <CheckCircle size={16} weight="fill" color="#16a34a" />,
            iconBg: '#dcfce7',
        };
    }

    return {
        icon: <Buildings size={16} weight="fill" color="#d97706" />,
        iconBg: '#fef3c7',
    };
}

export default function NotificationsDropdown({
    initialNotifications,
}: {
    initialNotifications: NotificationItem[];
}) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState(
        initialNotifications.map((item) => ({ ...item, unread: !item.is_read }))
    );
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => n.unread).length;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function markAllRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mark_all: true }),
        });
    }

    async function markOneRead(id: string) {
        setNotifications((prev) =>
            prev.map((x) => (x.id === id ? { ...x, unread: false } : x))
        );

        await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: id }),
        });
    }

    return (
        <div className={styles.dropdownWrapper} ref={ref}>
            <button
                className={`${styles.iconBtn}${open ? ' ' + styles.active : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={open}
            >
                <Bell size={18} weight={unreadCount > 0 ? 'fill' : 'regular'} />
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className={styles.dropdown} role="dialog" aria-label="Notifications">
                    <div className={styles.dropdownHeader}>
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className={styles.markAllRead} onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className={styles.dropdownList}>
                        {notifications.length === 0 ? (
                            <p className={styles.dropdownEmpty}>No notifications yet.</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`${styles.notifItem}${n.unread ? ' ' + styles.unread : ''}`}
                                    onClick={() => markOneRead(n.id)}
                                >
                                    <div
                                        className={styles.notifIcon}
                                        style={{ background: getNotificationIcon(n.notification_type).iconBg }}
                                    >
                                        {getNotificationIcon(n.notification_type).icon}
                                    </div>
                                    <div className={styles.notifBody}>
                                        <p className={styles.notifText}>
                                            <strong>{n.title}</strong>
                                            {n.body ? ` ${n.body}` : ''}
                                        </p>
                                        <span className={styles.notifTime}>{formatRelativeTime(n.created_at)}</span>
                                    </div>
                                    {n.unread && <div className={styles.unreadDot} />}
                                </div>
                            ))
                        )}
                    </div>
                    <div className={styles.dropdownFooter}>
                        <a href="/notifications">View all notifications</a>
                    </div>
                </div>
            )}
        </div>
    );
}
