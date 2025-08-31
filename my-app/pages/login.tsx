import { getCsrfToken, signIn } from "next-auth/react"
import { GetServerSideProps } from "next"
import { useState } from "react"
import { useRouter } from "next/router"

interface LoginPageProps {
  csrfToken: string
}

export default function LoginPage({ csrfToken }: LoginPageProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const target = e.currentTarget as typeof e.currentTarget & {
      email: { value: string }
      password: { value: string }
    }

    const res = await signIn("credentials", {
      redirect: false, // ❌ Prevent automatic redirect
      email: target.email.value,
      password: target.password.value,
    })

    if (res?.error) {
      // Show error message returned by NextAuth
      setErrorMessage(res.error)
    } else {
      // Login successful, redirect manually
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <form method="POST" onSubmit={handleSubmit}>
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const csrfToken = await getCsrfToken(context)
  return {
    props: { csrfToken },
  }
}