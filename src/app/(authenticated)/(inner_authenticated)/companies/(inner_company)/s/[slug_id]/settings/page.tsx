'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/components/companies/CompanyContext';
import styles from '@/styles/pages/companies/company-settings.module.scss';

const schema = z.object({
    name: z
        .string()
        .min(2, 'Company name must be at least 2 characters')
        .max(80, 'Company name must be 80 characters or less'),
    slug: z
        .string()
        .min(2, 'Slug must be at least 2 characters')
        .max(50, 'Slug must be 50 characters or less')
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lowercase letters, numbers, and hyphens only'),
    description: z
        .string()
        .max(300, 'Description must be 300 characters or less')
        .optional()
        .or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function CompanySettingsPage() {
    const router = useRouter();
    const { id, name, slug, description, memberRole } = useCompany();

    const [serverError, setServerError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name, slug, description: description ?? '' },
    });

    const descValue = watch('description') ?? '';

    async function onSubmit(values: FormValues) {
        setServerError('');
        setSaveSuccess(false);

        const res = await fetch('/api/companies/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...values }),
        });

        const data = await res.json();

        if (!res.ok) {
            setServerError(data.error ?? 'Something went wrong');
            return;
        }

        setSaveSuccess(true);

        // If slug changed, navigate to the updated settings URL
        if (data.company?.slug && data.company.slug !== slug) {
            router.push(`/companies/s/${data.company.slug}/settings`);
        } else {
            router.refresh();
        }
    }

    const canEdit = memberRole === 'owner' || memberRole === 'admin';

    return (
        <div className={styles.page}>
            {/* General Settings */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>General</h2>
                    <p className={styles.sectionDesc}>Update your company&apos;s name, URL slug, and description.</p>
                </div>
                <div className={styles.sectionBody}>
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
                        {serverError && (
                            <p className={styles.serverError}>{serverError}</p>
                        )}
                        {saveSuccess && (
                            <p className={styles.saveSuccess}>Changes saved successfully.</p>
                        )}

                        <div className={styles.field}>
                            <Label htmlFor="name">
                                Company name <span className={styles.required}>*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Acme Corp"
                                disabled={!canEdit}
                                {...register('name')}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
                        </div>

                        <div className={styles.field}>
                            <Label htmlFor="slug">
                                URL slug <span className={styles.required}>*</span>
                            </Label>
                            <div className={styles.slugInputWrapper}>
                                <span className={styles.slugPrefix}>kanflow.app/</span>
                                <Input
                                    id="slug"
                                    placeholder="acme-corp"
                                    disabled={!canEdit}
                                    {...register('slug')}
                                    aria-invalid={!!errors.slug}
                                    className={styles.slugInput}
                                />
                            </div>
                            {errors.slug ? (
                                <p className={styles.fieldError}>{errors.slug.message}</p>
                            ) : (
                                <p className={styles.fieldHint}>Changing the slug will update your company&apos;s URL.</p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <Label htmlFor="description">
                                Description{' '}
                                <span className={styles.optional}>(optional)</span>
                            </Label>
                            <textarea
                                id="description"
                                rows={3}
                                placeholder="What does your company do?"
                                disabled={!canEdit}
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

                        {canEdit && (
                            <div className={styles.actions}>
                                <Button type="submit" disabled={isSubmitting || !isDirty}>
                                    {isSubmitting ? 'Saving…' : 'Save changes'}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </section>

            {/* Danger Zone — owner only */}
            {memberRole === 'owner' && (
                <section className={`${styles.section} ${styles.dangerSection}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger zone</h2>
                        <p className={styles.sectionDesc}>Irreversible actions. Proceed with caution.</p>
                    </div>
                    <div className={styles.sectionBody}>
                        <div className={styles.dangerRow}>
                            <div>
                                <p className={styles.dangerLabel}>Delete this company</p>
                                <p className={styles.dangerHint}>
                                    Permanently deletes the company and all associated data. This cannot be undone.
                                </p>
                            </div>
                            <Button variant="destructive" type="button" disabled>
                                Delete company
                            </Button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
