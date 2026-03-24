"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import styles from "@/styles/onboarding.module.scss"
import { UsernameFormData, UsernameFormSchema } from "@/lib/schemas/onboarding/UsernameForm"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const UsernameForm = () => {
    const router = useRouter()
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<UsernameFormData>({
        resolver: zodResolver(UsernameFormSchema),
    })

    const onSubmit = async (data: UsernameFormData) => {
        setServerError(null)
        setIsLoading(true)

        try {
            const res = await fetch("/api/onboarding/username", {
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
                <Label htmlFor="userName">Username</Label>
                <Input
                    id="userName"
                    type="text"
                    placeholder="jane_doe"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    {...register("userName")}
                />
                {errors.userName
                    ? <p className={styles.error}>{errors.userName.message}</p>
                    : <p className={styles.hint}>Lowercase letters, numbers, and underscores only.</p>
                }
            </div>

            <div className={styles.actions}>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving…" : "Continue"}
                </Button>
            </div>
        </form>
    )
}

export default UsernameForm
