import { signOut } from "next-auth/react"

<button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>