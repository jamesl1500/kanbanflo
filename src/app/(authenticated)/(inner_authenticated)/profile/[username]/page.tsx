import Image from 'next/image';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import styles from '@/styles/pages/profile/profile-main.module.scss';
import { createClient } from '@/utils/supabase/server';
import ProfileTabs from '@/components/profile/ProfileTabs';

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select()
        .eq('user_name', username)
        .single();

    if (error || !profile) {
        notFound();
    }

    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');

    return (
        <div className={styles.profileMainPage}>
            <div className={styles.profileMainPageInner}>

                {/* ── Jumbotron ── */}
                <div className={styles.profileJumbotron}>
                    <div className={styles.profileJumbotronCover} />
                    <div className={styles.profileJumbotronUser}>
                        <div className={styles.profileAvatarRow}>
                            <Image
                                src="/default-avatar.png"
                                alt="Avatar"
                                width={96}
                                height={96}
                                className={styles.profileAvatar}
                                priority
                            />
                            <div className={styles.profileIdentity}>
                                <h2>{displayName}</h2>
                                <p>@{profile.user_name}</p>
                            </div>
                        </div>
                        {profile.bio && (
                            <p className={styles.profileBio}>{profile.bio}</p>
                        )}
                        <div className={styles.profileActions}>
                            <button className={styles.profileActionPrimary}>
                                Add Friend
                            </button>
                            <button className={styles.profileActionSecondary}>
                                Message
                            </button>
                            <button className={styles.profileActionSecondary}>
                                More
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
