'use client';

import { useState } from 'react';
import { CheckCircle, Buildings, Clock, ThumbsUp, ChatCircle } from '@phosphor-icons/react';
import styles from '@/styles/pages/profile/profile-main.module.scss';

type Tab = 'feed' | 'workspaces' | 'tasks';
type TaskStatus = 'completed' | 'in_progress' | 'todo';
type TaskPriority = 'high' | 'medium' | 'low';

type FeedItem =
    | { id: number; type: 'task_complete'; text: string; workspace: string; time: string }
    | { id: number; type: 'post'; text: string; time: string; likes: number; comments: number }
    | { id: number; type: 'joined'; text: string; time: string };

const DUMMY_FEED: FeedItem[] = [
    { id: 1, type: 'task_complete', text: 'Completed task "Design homepage mockup"', workspace: 'KanFlow', time: '2 hours ago' },
    { id: 2, type: 'post', text: 'Finished the sprint planning session — team is aligned on the Q2 roadmap.', time: '5 hours ago', likes: 4, comments: 2 },
    { id: 3, type: 'task_complete', text: 'Completed task "Set up CI/CD pipeline"', workspace: 'DevOps Alpha', time: '1 day ago' },
    { id: 4, type: 'joined', text: 'Joined workspace "Marketing Q2"', time: '2 days ago' },
    { id: 5, type: 'post', text: 'Just hit a 7-day streak. Consistency is the foundation of accountability.', time: '3 days ago', likes: 12, comments: 5 },
];

const DUMMY_WORKSPACES = [
    { id: 1, name: 'KanFlow', description: 'Main product development workspace.', members: 8, tasks: 34 },
    { id: 2, name: 'Marketing Q2', description: 'Q2 campaigns, content planning, and brand assets.', members: 5, tasks: 18 },
    { id: 3, name: 'DevOps Alpha', description: 'Infrastructure provisioning and pipeline automation.', members: 3, tasks: 12 },
];

const DUMMY_TASKS: Array<{
    id: number;
    title: string;
    workspace: string;
    status: TaskStatus;
    due: string;
    priority: TaskPriority;
}> = [
    { id: 1, title: 'Design homepage mockup', workspace: 'KanFlow', status: 'completed', due: 'Apr 2', priority: 'high' },
    { id: 2, title: 'Write API documentation', workspace: 'KanFlow', status: 'in_progress', due: 'Apr 6', priority: 'medium' },
    { id: 3, title: 'Set up CI/CD pipeline', workspace: 'DevOps Alpha', status: 'completed', due: 'Apr 1', priority: 'high' },
    { id: 4, title: 'Create social media content calendar', workspace: 'Marketing Q2', status: 'in_progress', due: 'Apr 8', priority: 'low' },
    { id: 5, title: 'User testing session prep', workspace: 'KanFlow', status: 'todo', due: 'Apr 10', priority: 'medium' },
];

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

export default function ProfileTabs() {
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
                        {DUMMY_FEED.map((item) => (
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
                                        {item.type === 'post' && (
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
                        {DUMMY_WORKSPACES.map((ws) => (
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
                        {DUMMY_TASKS.map((task) => (
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
