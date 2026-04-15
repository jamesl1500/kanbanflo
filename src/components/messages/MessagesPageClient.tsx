'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from '@/styles/pages/messages.module.scss';

type Conversation = {
    id: string;
    kind: 'direct' | 'group' | 'company_group';
    title: string;
    my_role: 'owner' | 'admin' | 'member';
    company: { id: string; slug: string; name: string } | null;
    members: Array<{ user_id: string; role: string; display_name: string }>;
    latest_message: {
        id: string;
        body: string;
        sender_user_id: string;
        sender_name: string;
        created_at: string;
    } | null;
    last_activity_at: string;
};

type Message = {
    id: string;
    conversation_id: string;
    sender_user_id: string;
    sender_name: string;
    body: string;
    created_at: string;
};

type ContactCompany = {
    id: string;
    slug: string;
    name: string;
    my_role: 'owner' | 'admin' | 'member';
    members: Array<{ user_id: string; role: string; display_name: string }>;
};

function formatTime(value: string): string {
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function MessagesPageClient({ currentUserId }: { currentUserId: string }) {
    const supabase = useMemo(() => createClient(), []);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [contacts, setContacts] = useState<ContactCompany[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [errorText, setErrorText] = useState<string | null>(null);

    const [newType, setNewType] = useState<'direct' | 'group'>('direct');
    const [newCompanySlug, setNewCompanySlug] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newMembers, setNewMembers] = useState<string[]>([]);
    const [creatingConversation, setCreatingConversation] = useState(false);
    const [showNewConversationForm, setShowNewConversationForm] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    async function refreshConversations() {
        setLoadingConversations(true);
        setErrorText(null);

        const response = await fetch('/api/conversations/list');
        if (!response.ok) {
            setErrorText('Failed to load conversations.');
            setLoadingConversations(false);
            return;
        }

        const data = await response.json();
        const nextConversations: Conversation[] = data.conversations ?? [];
        setConversations(nextConversations);

        const queryConversation = searchParams.get('conversation');
        if (queryConversation && nextConversations.some((conversation) => conversation.id === queryConversation)) {
            setSelectedConversationId(queryConversation);
        } else if (!selectedConversationId || !nextConversations.some((conversation) => conversation.id === selectedConversationId)) {
            setSelectedConversationId(nextConversations[0]?.id ?? null);
        }

        setLoadingConversations(false);
    }

    async function loadContacts() {
        const response = await fetch('/api/conversations/contacts');
        if (!response.ok) return;
        const data = await response.json();
        const nextContacts: ContactCompany[] = data.companies ?? [];
        setContacts(nextContacts);

        if (nextContacts.length > 0 && !newCompanySlug) {
            setNewCompanySlug(nextContacts[0].slug);
        }
    }

    async function loadMessages(conversationId: string) {
        setLoadingMessages(true);
        setErrorText(null);

        const response = await fetch('/api/conversations/messages/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId, limit: 200 }),
        });

        if (!response.ok) {
            setErrorText('Failed to load messages.');
            setMessages([]);
            setLoadingMessages(false);
            return;
        }

        const data = await response.json();
        setMessages(data.messages ?? []);
        setLoadingMessages(false);
    }

    useEffect(() => {
        refreshConversations();
        loadContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        loadMessages(selectedConversationId);

        const messageChannel = supabase
            .channel(`conversation-messages:${selectedConversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversation_messages',
                    filter: `conversation_id=eq.${selectedConversationId}`,
                },
                (payload) => {
                    const row = payload.new as {
                        id: string;
                        conversation_id: string;
                        sender_user_id: string;
                        body: string;
                        created_at: string;
                    };

                    const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);
                    const sender = selectedConversation?.members.find((member) => member.user_id === row.sender_user_id);

                    setMessages((prev) => {
                        if (prev.some((message) => message.id === row.id)) {
                            return prev;
                        }

                        return [
                            ...prev,
                            {
                                ...row,
                                sender_name: sender?.display_name ?? 'Unknown user',
                            },
                        ];
                    });

                    setConversations((prev) =>
                        prev
                            .map((conversation) =>
                                conversation.id === selectedConversationId
                                    ? {
                                        ...conversation,
                                        latest_message: {
                                            id: row.id,
                                            body: row.body,
                                            sender_user_id: row.sender_user_id,
                                            sender_name: sender?.display_name ?? 'Unknown user',
                                            created_at: row.created_at,
                                        },
                                        last_activity_at: row.created_at,
                                    }
                                    : conversation
                            )
                            .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
        };
        // conversations intentionally omitted to prevent channel churn on every message.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversationId, supabase]);

    useEffect(() => {
        const membershipChannel = supabase
            .channel(`conversation-members:${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversation_members',
                    filter: `user_id=eq.${currentUserId}`,
                },
                () => {
                    refreshConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(membershipChannel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, supabase]);

    const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
    const selectedCompanyContacts = contacts.find((company) => company.slug === newCompanySlug) ?? null;

    function toggleMember(id: string) {
        setNewMembers((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    }

    async function handleCreateConversation(e: React.FormEvent) {
        e.preventDefault();
        if (!newCompanySlug) return;

        setCreatingConversation(true);
        setErrorText(null);

        const response = await fetch('/api/conversations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: newType,
                company_slug: newCompanySlug,
                title: newType === 'group' ? newTitle : undefined,
                member_user_ids: newMembers,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            setErrorText(data.error ?? 'Unable to create conversation.');
            setCreatingConversation(false);
            return;
        }

        await refreshConversations();

        if (data.conversation?.id) {
            setSelectedConversationId(data.conversation.id);
            router.replace(`/messages?conversation=${data.conversation.id}`);
        }

        setNewMembers([]);
        setNewTitle('');
        setShowNewConversationForm(false);
        setCreatingConversation(false);
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedConversationId) return;

        const trimmed = messageInput.trim();
        if (!trimmed) return;

        setSending(true);
        setErrorText(null);

        const response = await fetch('/api/conversations/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: selectedConversationId, body: trimmed }),
        });

        const data = await response.json();

        if (!response.ok) {
            setErrorText(data.error ?? 'Unable to send message.');
            setSending(false);
            return;
        }

        if (data.message) {
            setMessages((prev) => {
                if (prev.some((message) => message.id === data.message.id)) return prev;
                return [
                    ...prev,
                    {
                        ...data.message,
                        sender_name: 'You',
                    },
                ];
            });
        }

        setMessageInput('');
        setSending(false);
    }

    return (
        <div className={styles.page}>
            <div className={styles.shell}>
                <aside className={styles.sidebar}>
                    <div className={styles.sectionHeader}>
                        <h1>Messages</h1>
                        <p>Private and group conversations.</p>
                    </div>

                    <button
                        type="button"
                        className={styles.newConversationToggle}
                        onClick={() => setShowNewConversationForm((prev) => !prev)}
                    >
                        {showNewConversationForm ? 'Hide new conversation' : 'New conversation'}
                    </button>

                    {showNewConversationForm && (
                        <form className={styles.newConversationForm} onSubmit={handleCreateConversation}>
                            <h2>New conversation</h2>
                            <label>
                                Type
                                <select value={newType} onChange={(e) => setNewType(e.target.value as 'direct' | 'group')}>
                                    <option value="direct">Direct</option>
                                    <option value="group">Group</option>
                                </select>
                            </label>

                            <label>
                                Company
                                <select value={newCompanySlug} onChange={(e) => { setNewCompanySlug(e.target.value); setNewMembers([]); }}>
                                    {contacts.map((company) => (
                                        <option key={company.id} value={company.slug}>{company.name}</option>
                                    ))}
                                </select>
                            </label>

                            {newType === 'group' && (
                                <label>
                                    Group name
                                    <input
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        maxLength={120}
                                        placeholder="Design team"
                                    />
                                </label>
                            )}

                            <div className={styles.membersList}>
                                <p>Members</p>
                                {(selectedCompanyContacts?.members ?? [])
                                    .filter((member) => member.user_id !== currentUserId)
                                    .map((member) => (
                                        <label key={member.user_id} className={styles.memberOption}>
                                            <input
                                                type="checkbox"
                                                checked={newMembers.includes(member.user_id)}
                                                onChange={() => toggleMember(member.user_id)}
                                            />
                                            <span>{member.display_name}</span>
                                        </label>
                                    ))}
                            </div>

                            <button type="submit" disabled={creatingConversation}>
                                {creatingConversation ? 'Creating...' : 'Create conversation'}
                            </button>
                        </form>
                    )}

                    <div className={styles.conversationList}>
                        {loadingConversations ? (
                            <p className={styles.empty}>Loading conversations...</p>
                        ) : conversations.length === 0 ? (
                            <p className={styles.empty}>No conversations yet.</p>
                        ) : (
                            conversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    className={`${styles.conversationItem}${selectedConversationId === conversation.id ? ` ${styles.conversationItemActive}` : ''}`}
                                    onClick={() => {
                                        setSelectedConversationId(conversation.id);
                                        router.replace(`/messages?conversation=${conversation.id}`);
                                    }}
                                >
                                    <div className={styles.conversationItemTop}>
                                        <strong>{conversation.title}</strong>
                                        <span>{formatTime(conversation.last_activity_at)}</span>
                                    </div>
                                    {conversation.latest_message && (
                                        <p>
                                            <b>{conversation.latest_message.sender_user_id === currentUserId ? 'You' : conversation.latest_message.sender_name}:</b>{' '}
                                            {conversation.latest_message.body}
                                        </p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                <section className={styles.chatPanel}>
                    {!selectedConversation ? (
                        <div className={styles.chatEmpty}>Pick a conversation to start chatting.</div>
                    ) : (
                        <>
                            <header className={styles.chatHeader}>
                                <h2>{selectedConversation.title}</h2>
                                <span>{selectedConversation.members.length} members</span>
                            </header>

                            <div className={styles.messages}>
                                {loadingMessages ? (
                                    <p className={styles.empty}>Loading messages...</p>
                                ) : messages.length === 0 ? (
                                    <p className={styles.empty}>No messages yet. Say hello.</p>
                                ) : (
                                    messages.map((message) => (
                                        <article
                                            key={message.id}
                                            className={`${styles.message}${message.sender_user_id === currentUserId ? ` ${styles.myMessage}` : ''}`}
                                        >
                                            <div className={styles.messageMeta}>
                                                <strong>{message.sender_user_id === currentUserId ? 'You' : message.sender_name}</strong>
                                                <span>{formatTime(message.created_at)}</span>
                                            </div>
                                            <p>{message.body}</p>
                                        </article>
                                    ))
                                )}
                            </div>

                            <form className={styles.messageComposer} onSubmit={handleSendMessage}>
                                <input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type your message..."
                                    maxLength={4000}
                                />
                                <button type="submit" disabled={sending || !messageInput.trim()}>
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </form>
                        </>
                    )}

                    {errorText && <p className={styles.error}>{errorText}</p>}
                </section>
            </div>
        </div>
    );
}
