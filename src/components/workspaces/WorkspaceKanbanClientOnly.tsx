'use client';

import dynamic from 'next/dynamic';

const WorkspaceKanban = dynamic(() => import('@/components/workspaces/WorkspaceKanban'), {
    ssr: false,
    loading: () => null,
});

type Priority = 'high' | 'medium' | 'low';

interface KanbanList {
    id: string;
    name: string;
    position: number;
    color: string | null;
}

interface KanbanCard {
    id: string;
    list_id: string;
    title: string;
    description: string | null;
    position: number;
    priority: Priority;
    due_date: string | null;
}

interface Props {
    workspaceId: string;
    companySlug: string;
    initialLists: KanbanList[];
    initialCards: KanbanCard[];
    canEditCards: boolean;
    canManageLists: boolean;
}

export default function WorkspaceKanbanClientOnly(props: Props) {
    return <WorkspaceKanban {...props} />;
}
