'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import styles from '@/styles/pages/companies/create-company.module.scss';

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

function toSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export default function CreateCompanyForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', slug: '', description: '' },
    });

    const nameValue = watch('name');
    const descValue = watch('description') ?? '';

    // Auto-generate slug from name unless user has manually edited it
    useEffect(() => {
        if (!slugTouched) {
            setValue('slug', toSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, slugTouched, setValue]);

    async function onSubmit(values: FormValues) {
        setServerError('');
        const res = await fetch('/api/companies/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const data = await res.json();

        if (!res.ok) {
            setServerError(data.error ?? 'Something went wrong');
            return;
        }

        router.push('/dashboard');
        router.refresh();
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Company Name */}
            <div className={styles.field}>
                <Label htmlFor="name">Company name <span className={styles.required}>*</span></Label>
                <Input
                    id="name"
                    placeholder="Acme Corp"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                />
                {errors.name && <p className={styles.fieldError}>{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div className={styles.field}>
                <Label htmlFor="slug">
                    URL slug <span className={styles.required}>*</span>
                </Label>
                <div className={styles.slugInputWrapper}>
                    <span className={styles.slugPrefix}>kanbanflo.com/</span>
                    <Input
                        id="slug"
                        placeholder="acme-corp"
                        {...register('slug')}
                        onChange={(e) => {
                            setSlugTouched(true);
                            setValue('slug', e.target.value, { shouldValidate: true });
                        }}
                        aria-invalid={!!errors.slug}
                        className={styles.slugInput}
                    />
                </div>
                {errors.slug ? (
                    <p className={styles.fieldError}>{errors.slug.message}</p>
                ) : (
                    <p className={styles.fieldHint}>Auto-generated from your company name. You can edit it.</p>
                )}
            </div>

            {/* Description */}
            <div className={styles.field}>
                <Label htmlFor="description">
                    Description <span className={styles.optional}>(optional)</span>
                </Label>
                <textarea
                    id="description"
                    className={styles.textarea}
                    placeholder="What does your company do?"
                    maxLength={300}
                    rows={3}
                    {...register('description')}
                    aria-invalid={!!errors.description}
                />
                <p className={`${styles.charCount} ${descValue.length > 270 ? styles.charCountWarn : ''}`}>
                    {descValue.length} / 300
                </p>
                {errors.description && <p className={styles.fieldError}>{errors.description.message}</p>}
            </div>

            {serverError && <p className={styles.serverError}>{serverError}</p>}

            <div className={styles.actions}>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create company'}
                </Button>
            </div>
        </form>
    );
}
