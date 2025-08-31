import { signOut, useSession } from "next-auth/react"

export default function Dashboard() {
  const { data: session } = useSession()

  return (
    <div>
      <h1>Welcome, {session?.user?.email}</h1>
      <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
    </div>
  )
}