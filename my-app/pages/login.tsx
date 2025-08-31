import { getCsrfToken, signIn } from "next-auth/react"
import { GetServerSideProps } from "next"

interface LoginPageProps {
  csrfToken: string
  error?: string
}

export default function LoginPage({ csrfToken, error }: LoginPageProps) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form
        method="POST"
        onSubmit={async e => {
          e.preventDefault()
          const target = e.currentTarget as typeof e.currentTarget & {
            email: { value: string }
            password: { value: string }
          }

          await signIn("credentials", {
            redirect: true,
            email: target.email.value,
            password: target.password.value,
            callbackUrl: "/dashboard",
          })
        }}
      >
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