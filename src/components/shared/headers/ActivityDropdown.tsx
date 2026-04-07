'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, CheckCircle, Buildings, UserPlus, PencilSimple } from '@phosphor-icons/react';
import styles from '@/styles/shared/headers/header-dropdowns.module.scss';

const ACTIVITIES = [
    {
        id: 1,
        icon: <CheckCircle size={15} weight="fill" color="#16a34a" />,
        iconBg: '#dcfce7',
        text: <>You completed <strong>"Design homepage mockup"</strong> in KanFlow.</>,
        time: '2 hrs ago',
    },
    {
        id: 2,
        icon: <PencilSimple size={15} weight="fill" color="#2563eb" />,
        iconBg: '#dbeafe',
        text: <>You updated task <strong>"Write API documentation"</strong>.</>,
        time: '5 hrs ago',
    },
    {
        id: 3,
        icon: <Buildings size={15} weight="fill" color="#d97706" />,
        iconBg: '#fef3c7',
        text: <>You joined workspace <strong>Marketing Q2</strong>.</>,
        time: 'Yesterday',
    },
    {
        id: 4,
        icon: <UserPlus size={15} weight="fill" color="#7c3aed" />,
        iconBg: '#ede9fe',
        text: <>You added <strong>Jordan Lee</strong> as a friend.</>,
        time: 'Yesterday',
    },
    {
        id: 5,
        icon: <CheckCircle size={15} weight="fill" color="#16a34a" />,
        iconBg: '#dcfce7',
        text: <>You completed <strong>"Set up CI/CD pipeline"</strong> in DevOps Alpha.</>,
        time: '2 days ago',
    },
];

export default function ActivityDropdown() {
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
                        {ACTIVITIES.map((item) => (
                            <div key={item.id} className={styles.activityItem}>
                                <div
                                    className={styles.activityIconWrap}
                                    style={{ background: item.iconBg }}
                                >
                                    {item.icon}
                                </div>
                                <div className={styles.activityBody}>
                                    <p className={styles.activityText}>{item.text}</p>
                                    <span className={styles.activityTime}>{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.dropdownFooter}>
                        <a href="/activity">View full activity log</a>
                    </div>
                </div>
            )}
        </div>
    );
}
