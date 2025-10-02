// pages/login.tsx:
import Head from 'next/head'
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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget as typeof e.currentTarget & {
      email: { value: string };
      password: { value: string };
    };

    setLoading(true);
    setErrorMessage(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: target.email.value,
      password: target.password.value,
    });

    setLoading(false);

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      router.push("/buyer/products");
    }
  };

  return (
    <>
      <Head>
        <title>Login | Vintage Marketplace</title>
        <meta name="description" content="Access your Vintage Marketplace account and continue shopping." />
      </Head>
      
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#8b4513] rounded-2xl p-3 shadow-lg">
                <img 
                  src="/logo.png"
                  alt="Vintage Marketplace" 
                  className="h-16 w-16 object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-[#5a4436] max-w-md mx-auto">
              Sign in to your account to continue your vintage journey
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="csrfToken" defaultValue={csrfToken} />

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8b4513] hover:text-[#6b3410] transition-colors duration-300 font-medium text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#8b4513] text-white rounded-xl font-bold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center mt-6 pt-6 border-t border-[#e6d9c6]">
              <p className="text-[#5a4436]">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/signup" 
                  className="text-[#8b4513] font-semibold hover:text-[#6b3410] underline transition-colors duration-300"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const csrfToken = await getCsrfToken(context);
  return { props: { csrfToken } };
};