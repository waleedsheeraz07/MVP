import { getCsrfToken, signIn, getProviders } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useState } from "react";

interface LoginPageProps {
  csrfToken: string;
  error?: string;
}

export default function LoginPage({ csrfToken, error }: LoginPageProps) {
  const [loginError, setLoginError] = useState<string | null>(error || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as typeof e.currentTarget & {
      email: { value: string };
      password: { value: string };
    };

    // signIn with redirect: false to catch errors
    const result = await signIn("credentials", {
      redirect: false,
      email: target.email.value,
      password: target.password.value,
    });

    if (result?.error) {
      setLoginError(result.error);
    } else if (result?.ok) {
      window.location.href = "/dashboard"; // manually redirect on success
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      {loginError && <p style={{ color: "red" }}>{loginError}</p>}
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
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const csrfToken = await getCsrfToken(context);
  const error = context.query.error as string | undefined;

  return {
    props: { csrfToken, error: error || null },
  };
};