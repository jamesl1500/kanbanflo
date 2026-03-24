"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import styles from "@/styles/onboarding.module.scss"
import { ProfileFormData, ProfileFormSchema } from "@/lib/schemas/onboarding/ProfileForm"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import cn from "clsx"

const MAX_BIO = 280

const ProfileForm = () => {
    const router = useRouter()
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: { bio: "" },
    })

    const bio = watch("bio") ?? ""

    const onSubmit = async (data: ProfileFormData) => {
        setServerError(null)
        setIsLoading(true)

        try {
            const res = await fetch("/api/onboarding/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await res.json()

            if (!res.ok) {
                setServerError(result.error ?? "Something went wrong")
                return
            }

            router.push(result.redirect)
        } catch {
            setServerError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            {serverError && <p className={styles.serverError}>{serverError}</p>}

            <div className={styles.field}>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                    id="bio"
                    className={styles.textarea}
                    placeholder="Tell the team a bit about yourself…"
                    maxLength={MAX_BIO}
                    {...register("bio")}
                />
                <span className={cn(styles.charCount, bio.length > MAX_BIO * 0.9 && styles.nearLimit)}>
                    {bio.length} / {MAX_BIO}
                </span>
                {errors.bio && <p className={styles.error}>{errors.bio.message}</p>}
            </div>

            <div className={styles.actions}>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => onSubmit({ bio: "" })}
                >
                    Skip
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving…" : "Finish"}
                </Button>
            </div>
        </form>
    )
}

export default ProfileForm
