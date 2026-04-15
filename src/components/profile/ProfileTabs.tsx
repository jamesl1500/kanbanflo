'use client';

import { useState } from 'react';
import { CheckCircle, Buildings, Clock, ThumbsUp, ChatCircle } from '@phosphor-icons/react';
import styles from '@/styles/pages/profile/profile-main.module.scss';

type Tab = 'feed' | 'workspaces' | 'tasks';
type TaskStatus = 'completed' | 'in_progress' | 'todo';
type TaskPriority = 'high' | 'medium' | 'low';

type FeedItem = {
    id: string;
    type: 'task_complete' | 'post' | 'joined';
    text: string;
    workspace?: string;
    time: string;
    likes?: number;
    comments?: number;
};

type WorkspaceItem = {
    id: string;
    name: string;
    description: string;
    members: number;
    tasks: number;
};

type TaskItem = {
    id: string;
    title: string;
    workspace: string;
    status: TaskStatus;
    due: string;
    priority: TaskPriority;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    todo: 'To Do',
};

function getStatusClass(status: TaskStatus): string {
    if (status === 'completed') return styles.taskStatusCompleted;
    if (status === 'in_progress') return styles.taskStatusInProgress;
    return styles.taskStatusTodo;
}

function getPriorityClass(priority: TaskPriority): string {
    if (priority === 'high') return styles.taskPriorityHigh;
    if (priority === 'medium') return styles.taskPriorityMedium;
    return styles.taskPriorityLow;
}

type ProfileTabsProps = {
    feed: FeedItem[];
    workspaces: WorkspaceItem[];
    tasks: TaskItem[];
};

export default function ProfileTabs({ feed, workspaces, tasks }: ProfileTabsProps) {
    const [active, setActive] = useState<Tab>('feed');

    return (
        <div className={styles.profileTabsWrapper}>
            <div className={styles.profileTabs}>
                <button
                    className={`${styles.profileTab}${active === 'feed' ? ' ' + styles.profileTabActive : ''}`}
                    onClick={() => setActive('feed')}
                >
                    Activity &amp; Posts
                </button>
                <button
                    className={`${styles.profileTab}${active === 'workspaces' ? ' ' + styles.profileTabActive : ''}`}
                    onClick={() => setActive('workspaces')}
                >
                    Workspaces
                </button>
                <button
                    className={`${styles.profileTab}${active === 'tasks' ? ' ' + styles.profileTabActive : ''}`}
                    onClick={() => setActive('tasks')}
                >
                    Tasks
                </button>
            </div>

            <div className={styles.profileTabContent}>
                {active === 'feed' && (
                    <div className={styles.feedList}>
                        {feed.length === 0 && (
                            <p className={styles.tabEmpty}>No recent activity yet.</p>
                        )}
                        {feed.map((item) => (
                            <div key={item.id} className={styles.feedItem}>
                                <div className={styles.feedItemIcon}>
                                    {item.type === 'task_complete' && (
                                        <CheckCircle size={18} weight="fill" color="#22c55e" />
                                    )}
                                    {item.type === 'post' && (
                                        <ChatCircle size={18} weight="fill" color="#0070f3" />
                                    )}
                                    {item.type === 'joined' && (
                                        <Buildings size={18} weight="fill" color="#f59e0b" />
                                    )}
                                </div>
                                <div className={styles.feedItemContent}>
                                    <p className={styles.feedItemText}>{item.text}</p>
                                    {item.type === 'task_complete' && (
                                        <span className={styles.feedItemWorkspaceTag}>
                                            {item.workspace}
                                        </span>
                                    )}
                                    <div className={styles.feedItemMeta}>
                                        <span className={styles.feedItemTime}>
                                            <Clock size={11} />
                                            {item.time}
                                        </span>
                                        {item.type === 'post' && typeof item.likes === 'number' && (
                                            <span className={styles.feedItemLikes}>
                                                <ThumbsUp size={11} />
                                                {item.likes}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {active === 'workspaces' && (
                    <div className={styles.workspaceGrid}>
                        {workspaces.length === 0 && (
                            <p className={styles.tabEmpty}>No workspaces found.</p>
                        )}
                        {workspaces.map((ws) => (
                            <div key={ws.id} className={styles.workspaceCard}>
                                <div className={styles.workspaceCardHeader}>
                                    <Buildings size={18} weight="fill" color="#0070f3" />
                                    <span className={styles.workspaceCardName}>{ws.name}</span>
                                    <span className={styles.workspaceCardBadge}>Active</span>
                                </div>
                                <p className={styles.workspaceCardDesc}>{ws.description}</p>
                                <div className={styles.workspaceCardFooter}>
                                    <span>{ws.members} members</span>
                                    <span>{ws.tasks} tasks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {active === 'tasks' && (
                    <div className={styles.taskList}>
                        {tasks.length === 0 && (
                            <p className={styles.tabEmpty}>No assigned tasks yet.</p>
                        )}
                        {tasks.map((task) => (
                            <div key={task.id} className={styles.taskItem}>
                                <span
                                    className={`${styles.taskStatus} ${getStatusClass(task.status)}`}
                                >
                                    {STATUS_LABELS[task.status]}
                                </span>
                                <div className={styles.taskItemBody}>
                                    <span className={styles.taskItemTitle}>{task.title}</span>
                                    <span className={styles.taskItemWorkspace}>{task.workspace}</span>
                                </div>
                                <div className={styles.taskItemRight}>
                                    <span
                                        className={`${styles.taskPriority} ${getPriorityClass(task.priority)}`}
                                    >
                                        {task.priority}
                                    </span>
                                    <span className={styles.taskDue}>Due {task.due}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
