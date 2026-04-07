import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import styles from '@/styles/pages/edit-profile.module.scss';
import { createClient } from '@/utils/supabase/server';
import EditProfileForm from '@/components/profile/EditProfileForm';

export default async function EditProfilePage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_name, bio, avatar_id, cover_photo_id')
        .eq('id', user.id)
        .single();

    // Resolve avatar and cover public URLs from the files table
    let avatarUrl: string | null = null;
    let coverUrl: string | null = null;

    if (profile?.avatar_id) {
        const { data: avatarFile } = await supabase
            .from('files')
            .select('file_bucket, file_folder, file_name')
            .eq('id', profile.avatar_id)
            .single();

        if (avatarFile?.file_bucket && avatarFile.file_name) {
            const path = [avatarFile.file_folder, avatarFile.file_name].filter(Boolean).join('/');
            const { data } = supabase.storage.from(avatarFile.file_bucket).getPublicUrl(path);
            avatarUrl = data.publicUrl;
        }
    }

    if (profile?.cover_photo_id) {
        const { data: coverFile } = await supabase
            .from('files')
            .select('file_bucket, file_folder, file_name')
            .eq('id', profile.cover_photo_id)
            .single();

        if (coverFile?.file_bucket && coverFile.file_name) {
            const path = [coverFile.file_folder, coverFile.file_name].filter(Boolean).join('/');
            const { data } = supabase.storage.from(coverFile.file_bucket).getPublicUrl(path);
            coverUrl = data.publicUrl;
        }
    }

    return (
        <div className={styles.editProfilePage}>
            <div className={styles.editProfileInner}>
                <div className={styles.pageHeader}>
                    <h1>Edit Profile</h1>
                    <p>Update your photos, name, username, and bio.</p>
                </div>
            </div>

            <EditProfileForm
                userId={user.id}
                initialData={{
                    first_name: profile?.first_name ?? '',
                    last_name: profile?.last_name ?? '',
                    user_name: profile?.user_name ?? null,
                    bio: profile?.bio ?? null,
                    avatarUrl,
                    coverUrl,
                }}
            />
        </div>
    );
}
