'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User } from '@phosphor-icons/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import styles from '@/styles/pages/edit-profile.module.scss';

const EditProfileSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(50),
    last_name: z.string().min(1, 'Last name is required').max(50),
    user_name: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    bio: z.string().max(280, 'Bio must be 280 characters or less').optional().or(z.literal('')),
});

type EditProfileData = z.infer<typeof EditProfileSchema>;

interface EditProfileFormProps {
    userId: string;
    initialData: {
        first_name: string;
        last_name: string;
        user_name: string | null;
        bio: string | null;
        avatarUrl: string | null;
        coverUrl: string | null;
    };
}

export default function EditProfileForm({ userId, initialData }: EditProfileFormProps) {
    const router = useRouter();
    const supabase = createClient();

    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatarUrl);
    const [coverUrl, setCoverUrl] = useState<string | null>(initialData.coverUrl);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<EditProfileData>({
        resolver: zodResolver(EditProfileSchema),
        defaultValues: {
            first_name: initialData.first_name,
            last_name: initialData.last_name,
            user_name: initialData.user_name ?? '',
            bio: initialData.bio ?? '',
        },
    });

    const bioValue = watch('bio') ?? '';

    // ── File upload helper ────────────────────────────────────────────────────

    async function uploadImage(
        file: File,
        bucket: 'avatars' | 'covers',
        setUploading: (v: boolean) => void,
        setUrl: (url: string) => void,
        profileField: 'avatar_id' | 'cover_photo_id'
    ) {
        setUploading(true);
        setUploadError(null);

        try {
            const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
            const fileName = `${profileField === 'avatar_id' ? 'avatar' : 'cover'}.${ext}`;
            const folderPath = `${userId}/${fileName}`;

            // 1. Upload to Supabase Storage (upsert so re-uploads replace existing)
            const { error: storageError } = await supabase.storage
                .from(bucket)
                .upload(folderPath, file, { upsert: true, contentType: file.type });

            if (storageError) throw new Error(storageError.message);

            // 2. Get the public URL to preview immediately
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(folderPath);
            setUrl(urlData.publicUrl);

            // 3. Upsert file record in public.files (unique on owner+bucket+folder+name)
            const { data: fileRecord, error: fileError } = await supabase
                .from('files')
                .upsert(
                    {
                        owner_id: userId,
                        file_name: fileName,
                        file_mime: file.type,
                        file_size: file.size,
                        file_bucket: bucket,
                        file_folder: userId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'owner_id,file_bucket,file_folder,file_name', ignoreDuplicates: false }
                )
                .select('id')
                .single();

            if (fileError || !fileRecord) throw new Error(fileError?.message ?? 'File record error');

            // 4. Link file to profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ [profileField]: fileRecord.id })
                .eq('id', userId);

            if (profileError) throw new Error(profileError.message);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadImage(file, 'avatars', setUploadingAvatar, setAvatarUrl, 'avatar_id');
    }

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadImage(file, 'covers', setUploadingCover, setCoverUrl, 'cover_photo_id');
    }

    // ── Basic info submit ─────────────────────────────────────────────────────

    const onSubmit = async (data: EditProfileData) => {
        setServerError(null);
        setSuccess(false);
        setIsLoading(true);

        try {
            const res = await fetch('/api/profile/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                setServerError(result.error ?? 'Something went wrong');
                return;
            }

            setSuccess(true);
            router.refresh();
        } catch {
            setServerError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.editProfileInner}>

            {/* ── Photos ──────────────────────────────────────────────────── */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Profile Photos</h2>
                <p className={styles.cardDescription}>
                    Update your cover photo and avatar. Images are saved immediately on selection.
                </p>

                {uploadError && (
                    <p className={styles.serverError} style={{ marginBottom: 12 }}>{uploadError}</p>
                )}

                <div className={styles.photoSection}>
                    {/* Cover */}
                    <div
                        className={styles.coverUploadArea}
                        onClick={() => coverInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && coverInputRef.current?.click()}
                        aria-label="Upload cover photo"
                    >
                        {coverUrl ? (
                            <Image src={coverUrl} alt="Cover" fill style={{ objectFit: 'cover' }} sizes="760px" />
                        ) : (
                            <div className={styles.coverPlaceholder}>
                                <Camera size={28} />
                                <span>Click to upload cover photo</span>
                            </div>
                        )}
                        <div className={styles.coverOverlay}>
                            <Camera size={22} />
                            <span>Change cover photo</span>
                        </div>
                        {uploadingCover && <div className={styles.uploading}>Uploading…</div>}
                    </div>

                    {/* Avatar */}
                    <div className={styles.avatarUploadRow}>
                        <div
                            className={styles.avatarUploadArea}
                            onClick={() => avatarInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && avatarInputRef.current?.click()}
                            aria-label="Upload avatar"
                        >
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: 'cover' }} sizes="88px" />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <User size={36} />
                                </div>
                            )}
                            <div className={styles.avatarOverlay}>
                                <Camera size={18} />
                            </div>
                            {uploadingAvatar && <div className={styles.uploading}>…</div>}
                        </div>
                        <div className={styles.avatarHint}>
                            <strong>Avatar</strong>
                            JPG, PNG or WebP · max 5 MB
                        </div>
                    </div>
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                />
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleCoverChange}
                />
            </div>

            {/* ── Basic info ──────────────────────────────────────────────── */}
            <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
                <h2 className={styles.cardTitle}>Basic Information</h2>
                <p className={styles.cardDescription}>
                    Update your name, username, and bio.
                </p>

                {serverError && <p className={styles.serverError}>{serverError}</p>}
                {success && <p className={styles.successMessage}>Profile updated successfully.</p>}

                <div className={styles.formSection}>
                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <Label htmlFor="first_name">First name</Label>
                            <Input
                                id="first_name"
                                {...register('first_name')}
                                aria-invalid={!!errors.first_name}
                            />
                            {errors.first_name && (
                                <span className={styles.fieldError}>{errors.first_name.message}</span>
                            )}
                        </div>
                        <div className={styles.field}>
                            <Label htmlFor="last_name">Last name</Label>
                            <Input
                                id="last_name"
                                {...register('last_name')}
                                aria-invalid={!!errors.last_name}
                            />
                            {errors.last_name && (
                                <span className={styles.fieldError}>{errors.last_name.message}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <Label htmlFor="user_name">Username</Label>
                        <Input
                            id="user_name"
                            {...register('user_name')}
                            aria-invalid={!!errors.user_name}
                            placeholder="e.g. john_doe"
                        />
                        {errors.user_name && (
                            <span className={styles.fieldError}>{errors.user_name.message}</span>
                        )}
                    </div>

                    <div className={styles.field}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Label htmlFor="bio">Bio</Label>
                            <span
                                className={`${styles.charCount}${bioValue.length > 250 ? ' ' + styles.charCountWarning : ''}`}
                            >
                                {bioValue.length}/280
                            </span>
                        </div>
                        <textarea
                            id="bio"
                            className={styles.textarea}
                            placeholder="Tell people a little about yourself and your goals…"
                            {...register('bio')}
                        />
                        {errors.bio && (
                            <span className={styles.fieldError}>{errors.bio.message}</span>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
