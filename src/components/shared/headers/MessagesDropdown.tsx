'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatCircle } from '@phosphor-icons/react';
import styles from '@/styles/shared/headers/header-dropdowns.module.scss';

const AVATAR_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626'];

const MESSAGES = [
    {
        id: 1,
        unread: true,
        initials: 'AR',
        color: AVATAR_COLORS[0],
        sender: 'Alex Rivera',
        preview: 'Hey, did you finish reviewing the sprint board?',
        time: '4 min ago',
    },
    {
        id: 2,
        unread: true,
        initials: 'JL',
        color: AVATAR_COLORS[1],
        sender: 'Jordan Lee',
        preview: 'The design assets are ready to review 🎨',
        time: '42 min ago',
    },
    {
        id: 3,
        unread: false,
        initials: 'SK',
        color: AVATAR_COLORS[2],
        sender: 'Sam Kim',
        preview: 'Can we sync tomorrow morning before standup?',
        time: '2 hrs ago',
    },
    {
        id: 4,
        unread: false,
        initials: 'MC',
        color: AVATAR_COLORS[3],
        sender: 'Morgan Chen',
        preview: 'Thanks for adding me to the workspace!',
        time: 'Yesterday',
    },
    {
        id: 5,
        unread: false,
        initials: 'TP',
        color: AVATAR_COLORS[4],
        sender: 'Taylor Park',
        preview: 'Merged the PR. Deployment is live.',
        time: '2 days ago',
    },
];

export default function MessagesDropdown() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(MESSAGES);
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = messages.filter((m) => m.unread).length;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function openMessage(id: number) {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
        );
    }

    return (
        <div className={styles.dropdownWrapper} ref={ref}>
            <button
                className={`${styles.iconBtn}${open ? ' ' + styles.active : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label="Messages"
                aria-haspopup="true"
                aria-expanded={open}
            >
                <ChatCircle size={18} weight={unreadCount > 0 ? 'fill' : 'regular'} />
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className={styles.dropdown} role="dialog" aria-label="Messages">
                    <div className={styles.dropdownHeader}>
                        <h3>Messages</h3>
                        {unreadCount > 0 && (
                            <button
                                className={styles.markAllRead}
                                onClick={() =>
                                    setMessages((prev) => prev.map((m) => ({ ...m, unread: false })))
                                }
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className={styles.dropdownList}>
                        {messages.length === 0 ? (
                            <p className={styles.dropdownEmpty}>No messages yet.</p>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`${styles.messageItem}${msg.unread ? ' ' + styles.unread : ''}`}
                                    onClick={() => openMessage(msg.id)}
                                >
                                    <div
                                        className={styles.messageAvatar}
                                        style={{ background: msg.color }}
                                    >
                                        {msg.initials}
                                    </div>
                                    <div className={styles.messageBody}>
                                        <div className={styles.messageTop}>
                                            <span className={styles.messageSender}>{msg.sender}</span>
                                            <span className={styles.messageTime}>{msg.time}</span>
                                        </div>
                                        <p
                                            className={`${styles.messagePreview}${msg.unread ? ' ' + styles.messageUnreadPreview : ''}`}
                                        >
                                            {msg.preview}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className={styles.dropdownFooter}>
                        <a href="/messages">Open messages</a>
                    </div>
                </div>
            )}
        </div>
    );
}
