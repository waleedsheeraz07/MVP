// components/ForceLogout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function ForceLogout() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    // If user is blocked or deleted, log them out
    if (session.user.role === "BLOCKED" || session.user.role === "DELETED") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return null; // this component does not render anything
}