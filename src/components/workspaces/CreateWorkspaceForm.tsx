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
import styles from '@/styles/pages/companies/workspace-create.module.scss';

const schema = z.object({
    name: z.string().min(1, 'Workspace name is required').max(80, 'Name must be 80 characters or less'),
    description: z
        .string()
        .max(300, 'Description must be 300 characters or less')
        .optional()
        .or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    companyId: string;
    slug: string;
}

export default function CreateWorkspaceForm({ companyId, slug }: Props) {
    const router = useRouter();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', description: '' },
    });

    const descValue = watch('description') ?? '';

    async function onSubmit(values: FormValues) {
        setServerError('');
        const res = await fetch('/api/workspaces/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: companyId, ...values }),
        });

        const data = await res.json();

        if (!res.ok) {
            setServerError(data.error ?? 'Something went wrong');
            return;
        }

        router.push(`/companies/s/${slug}/workspaces/${data.workspace.id}`);
        router.refresh();
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1>Create workspace</h1>
                    <p>Workspaces are Kanban boards for organizing tasks within your company.</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
                    {serverError && <p className={styles.serverError}>{serverError}</p>}

                    <div className={styles.field}>
                        <Label htmlFor="name">
                            Workspace name <span className={styles.required}>*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g. Backend Sprint 4"
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
                            placeholder="What is this workspace for?"
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

                    <div className={styles.actions}>
                        <Link href={`/companies/s/${slug}/workspaces`}>
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating…' : 'Create workspace'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
