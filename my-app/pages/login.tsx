import { FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/router"

const LoginPage = () => {
  const router = useRouter()

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const email = (form.email as HTMLInputElement).value
    const password = (form.password as HTMLInputElement).value

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (res?.ok) router.push("/dashboard")
  }

  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Login</button>
    </form>
  )
}

export default LoginPage