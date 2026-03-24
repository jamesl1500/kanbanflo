"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import styles from "@/styles/login.module.scss"
import { LoginFormData, LoginFormSchema } from "@/lib/schemas/auth/LoginForm"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const LoginForm = () => {
    const router = useRouter()
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(LoginFormSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null)
        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await res.json()

            if (!res.ok) {
                setServerError(result.error ?? "Invalid email or password")
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
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    {...register("email")}
                />
                {errors.email && <p className={styles.error}>{errors.email.message}</p>}
            </div>

            <div className={styles.field}>
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    {...register("password")}
                />
                {errors.password && <p className={styles.error}>{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in…" : "Sign in"}
            </Button>
        </form>
    )
}

export default LoginForm
