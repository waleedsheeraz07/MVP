import { getCsrfToken, signIn } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

interface LoginPageProps {
  csrfToken: string;
}

export default function LoginPage({ csrfToken }: LoginPageProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as typeof e.currentTarget & {
      email: { value: string };
      password: { value: string };
    };

    const res = await signIn("credentials", {
      redirect: false,
      email: target.email.value,
      password: target.password.value,
    });

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "#f9f5f0",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "1.8rem" }}>
          Login
        </h1>

        {errorMessage && (
          <p
            style={{
              color: "red",
              background: "#ffe5e5",
              padding: "0.75rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
            }}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
             {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
          Don’t have an account?{" "}
          <Link href="/signup" style={{ color: "#4CAF50", fontWeight: "bold", textDecoration: "underline" }}>
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const csrfToken = await getCsrfToken(context);
  return { props: { csrfToken } };
};