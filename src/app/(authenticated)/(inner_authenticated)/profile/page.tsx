import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import styles from '@/styles/pages/profile/profile-main.module.scss';
import { createClient } from '@/utils/supabase/server';
import ProfileTabs from '@/components/profile/ProfileTabs';

export default async function ProfileMainPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

    const displayName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
        : (user.email ?? 'User');

    // Get avatar and cover URLs if they exist
    if (profile) {
        if (profile.avatar_id) {
            const { data: avatarFile } = await supabase
                .from('files')
                .select('file_bucket, file_folder, file_name')
                .eq('id', profile.avatar_id)
                .single();

            if (avatarFile?.file_bucket && avatarFile.file_name) {
                const path = [avatarFile.file_folder, avatarFile.file_name].filter(Boolean).join('/');
                const { data } = supabase.storage.from(avatarFile.file_bucket).getPublicUrl(path);
                profile.avatar_url = data.publicUrl;
            }
        }

        if (profile.cover_photo_id) {
            const { data: coverFile } = await supabase
                .from('files')
                .select('file_bucket, file_folder, file_name')
                .eq('id', profile.cover_photo_id)
                .single();

            if (coverFile?.file_bucket && coverFile.file_name) {
                const path = [coverFile.file_folder, coverFile.file_name].filter(Boolean).join('/');
                const { data } = supabase.storage.from(coverFile.file_bucket).getPublicUrl(path);
                profile.cover_url = data.publicUrl;
            }
        }
    }

    return (
        <div className={styles.profileMainPage}>
            <div className={styles.profileMainPageInner}>

                {/* ── Jumbotron ── */}
                <div className={styles.profileJumbotron}>
                    <div className={styles.profileJumbotronCover} />
                    <div className={styles.profileJumbotronUser}>
                        <div className={styles.profileAvatarRow}>
                            <Image
                                src={profile?.avatar_url ?? "/default-avatar.png"}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className={styles.profileAvatar}
                                priority
                            />
                            <div className={styles.profileIdentity}>
                                <h2>{displayName}</h2>
                                {profile?.user_name && <p>@{profile.user_name}</p>}
                            </div>
                        </div>
                        {profile?.bio && (
                            <p className={styles.profileBio}>{profile.bio}</p>
                        )}
                        <div className={styles.profileActions}>
                            <button className={styles.profileActionSecondary}>
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stat cards ── */}
                <div className={styles.profileStats}>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>47</div>
                        <div className={styles.profileStatLabel}>Tasks Done</div>
                    </div>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>3</div>
                        <div className={styles.profileStatLabel}>Workspaces</div>
                    </div>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>24</div>
                        <div className={styles.profileStatLabel}>Friends</div>
                    </div>
                    <div className={styles.profileStatCard}>
                        <div className={styles.profileStatValue}>7</div>
                        <div className={styles.profileStatLabel}>Day Streak</div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className={styles.profileContent}>
                    <ProfileTabs />
                </div>

            </div>
        </div>
    );
}
