'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import styles from '@/styles/pages/companies/workspace-settings.module.scss';

const schema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(80, 'Name must be 80 characters or less'),
    description: z
        .string()
        .max(300, 'Description must be 300 characters or less')
        .optional()
        .or(z.literal('')),
    status: z.enum(['active', 'archived']),
});

type FormValues = z.infer<typeof schema>;

interface Workspace {
    id: string;
    name: string;
    description: string | null;
    status: 'active' | 'archived';
    owner_id: string;
}

interface Props {
    workspace: Workspace;
    slug: string;
    isOwner: boolean;
}

export default function WorkspaceSettingsForm({ workspace, slug, isOwner }: Props) {
    const router = useRouter();
    const [serverError, setServerError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: workspace.name,
            description: workspace.description ?? '',
            status: workspace.status,
        },
    });

    const descValue = watch('description') ?? '';

    async function onSubmit(values: FormValues) {
        setServerError('');
        setSaveSuccess(false);

        const res = await fetch('/api/workspaces/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: workspace.id, ...values }),
        });

        const data = await res.json();
        if (!res.ok) {
            setServerError(data.error ?? 'Something went wrong');
            return;
        }

        setSaveSuccess(true);
        router.refresh();
    }

    async function handleDelete() {
        if (!confirm('Permanently delete this workspace and all its cards? This cannot be undone.')) return;
        setDeleting(true);

        const res = await fetch('/api/workspaces/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: workspace.id }),
        });

        if (res.ok) {
            router.push(`/companies/s/${slug}/workspaces`);
            router.refresh();
        } else {
            const data = await res.json();
            setServerError(data.error ?? 'Failed to delete workspace');
            setDeleting(false);
        }
    }

    return (
        <div className={styles.page}>
            {/* General */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>General</h2>
                    <p className={styles.sectionDesc}>Update this workspace&apos;s name, description, and status.</p>
                </div>
                <div className={styles.sectionBody}>
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
                        {serverError && <p className={styles.serverError}>{serverError}</p>}
                        {saveSuccess && <p className={styles.saveSuccess}>Changes saved successfully.</p>}

                        <div className={styles.field}>
                            <Label htmlFor="name">
                                Workspace name <span className={styles.required}>*</span>
                            </Label>
                            <Input
                                id="name"
                                {...register('name')}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
                        </div>

                        <div className={styles.field}>
                            <Label htmlFor="description">
                                Description <span className={styles.optional}>(optional)</span>
                            </Label>
                            <textarea
                                id="description"
                                rows={3}
                                className={styles.textarea}
                                {...register('description')}
                            />
                            <p className={`${styles.charCount} ${descValue.length > 270 ? styles.charCountWarn : ''}`}>
                                {descValue.length} / 300
                            </p>
                            {errors.description && (
                                <p className={styles.fieldError}>{errors.description.message}</p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <Label htmlFor="status">Status</Label>
                            <select id="status" className={styles.select} {...register('status')}>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/companies/s/${slug}/workspaces/${workspace.id}`}>
                                <Button type="button" variant="outline">Back to board</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting || !isDirty}>
                                {isSubmitting ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Danger Zone */}
            {isOwner && (
                <section className={`${styles.section} ${styles.dangerSection}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger zone</h2>
                        <p className={styles.sectionDesc}>Irreversible actions. Proceed with caution.</p>
                    </div>
                    <div className={styles.sectionBody}>
                        <div className={styles.dangerRow}>
                            <div>
                                <p className={styles.dangerLabel}>Delete this workspace</p>
                                <p className={styles.dangerHint}>
                                    Permanently deletes all lists and cards. This cannot be undone.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting…' : 'Delete workspace'}
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
