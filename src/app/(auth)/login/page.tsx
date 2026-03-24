import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import LoginForm from "@/components/forms/auth/LoginForm"
import styles from "@/styles/login.module.scss"

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your KanFlow account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/signup">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

