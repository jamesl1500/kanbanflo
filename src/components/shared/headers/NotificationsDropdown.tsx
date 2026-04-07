'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle, UserPlus, Buildings } from '@phosphor-icons/react';
import styles from '@/styles/shared/headers/header-dropdowns.module.scss';

const NOTIFICATIONS = [
    {
        id: 1,
        unread: true,
        icon: <UserPlus size={16} weight="fill" color="#2563eb" />,
        iconBg: '#dbeafe',
        text: <><strong>Alex Rivera</strong> sent you a friend request.</>,
        time: '2 min ago',
    },
    {
        id: 2,
        unread: true,
        icon: <CheckCircle size={16} weight="fill" color="#16a34a" />,
        iconBg: '#dcfce7',
        text: <><strong>Jordan Lee</strong> completed a task you assigned: "Design homepage".</>,
        time: '18 min ago',
    },
    {
        id: 3,
        unread: true,
        icon: <Buildings size={16} weight="fill" color="#d97706" />,
        iconBg: '#fef3c7',
        text: <>You were added to workspace <strong>Marketing Q2</strong>.</>,
        time: '1 hr ago',
    },
    {
        id: 4,
        unread: false,
        icon: <CheckCircle size={16} weight="fill" color="#16a34a" />,
        iconBg: '#dcfce7',
        text: <><strong>Sam Kim</strong> marked task "Write API docs" as complete.</>,
        time: '3 hrs ago',
    },
    {
        id: 5,
        unread: false,
        icon: <UserPlus size={16} weight="fill" color="#2563eb" />,
        iconBg: '#dbeafe',
        text: <><strong>Morgan Chen</strong> accepted your friend request.</>,
        time: 'Yesterday',
    },
];

export default function NotificationsDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState(NOTIFICATIONS);
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

    function markAllRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
                                    onClick={() =>
                                        setNotifications((prev) =>
                                            prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                                        )
                                    }
                                >
                                    <div
                                        className={styles.notifIcon}
                                        style={{ background: n.iconBg }}
                                    >
                                        {n.icon}
                                    </div>
                                    <div className={styles.notifBody}>
                                        <p className={styles.notifText}>{n.text}</p>
                                        <span className={styles.notifTime}>{n.time}</span>
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
