'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatCircle } from '@phosphor-icons/react';
import styles from '@/styles/shared/headers/header-dropdowns.module.scss';

type MessageItem = {
    id: string;
    conversation_id: string;
    unread: boolean;
    initials: string;
    color: string;
    sender: string;
    preview: string;
    time: string;
};

function formatRelativeTime(input: string): string {
    const timestamp = new Date(input).getTime();
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MessagesDropdown({ initialMessages }: { initialMessages: MessageItem[] }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(initialMessages);
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

    function openMessage(id: string) {
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
                                            <span className={styles.messageTime}>{formatRelativeTime(msg.time)}</span>
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
