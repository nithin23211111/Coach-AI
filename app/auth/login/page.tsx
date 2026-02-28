"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Unable to continue with Google.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-black text-white">
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden rounded-3xl m-6 bg-gradient-to-br from-purple-700 via-indigo-800 to-black p-12 flex-col justify-center items-center text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/coach-ai-logo.png"
            alt="Coach AI logo"
            width={48}
            height={48}
            className="w-12 h-12 object-contain"
            priority
          />
          <span className="text-3xl font-semibold">Coach AI</span>
        </Link>

        <h1 className="text-3xl font-semibold mt-6">Welcome Back</h1>
        <p className="text-slate-300 mt-4 max-w-md">
          Sign in to continue your interview prep and career coaching journey with Coach AI.
        </p>

        <div className="space-y-4 mt-8 w-full max-w-sm">
          <button
            type="button"
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Sign In
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Create Account
          </button>
        </div>

        <Image
          src="/images/auth/login-robot.png"
          alt="Decorative login robot"
          width={176}
          height={176}
          className="pointer-events-none absolute left-6 top-8 w-32 sm:w-36 md:w-40 opacity-95"
          style={{ animation: "loginFloat 6s ease-in-out infinite" }}
        />
        <Image
          src="/images/auth/login-sphere.png"
          alt="Decorative login sphere"
          width={192}
          height={192}
          className="pointer-events-none absolute right-8 top-10 w-36 sm:w-40 md:w-44 opacity-60"
        />
        <Image
          src="/images/auth/login-grid.png"
          alt="Decorative login grid"
          width={208}
          height={208}
          className="pointer-events-none absolute bottom-8 right-8 w-36 sm:w-40 md:w-44 opacity-40 blur-[1px]"
        />
      </section>

      <section className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl p-10 border border-slate-800 shadow-2xl ring-1 ring-white/10">
          <h2 className="text-2xl font-semibold">Sign In</h2>
          <p className="text-slate-400 mt-2">Use your account credentials to continue.</p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-6 flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-3 transition font-medium"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"
              />
              <path
                fill="#34A853"
                d="M3.7 7.8l3.2 2.3C7.8 8 9.7 6.6 12 6.6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2c-3.6 0-6.7 2-8.3 4.9z"
              />
              <path
                fill="#FBBC05"
                d="M12 20.6c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1-3.4 1-3.9 0-5.2-2.4-5.4-3.6l-3.2 2.4c1.6 2.9 4.7 5 8.6 5z"
              />
              <path
                fill="#4285F4"
                d="M21.1 13.3c0-.5-.1-.9-.1-1.3H12v3.9h5.4c-.3 1.5-1.3 2.6-2.4 3.3l3 2.4c1.8-1.7 3.1-4.1 3.1-8.3z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-400 tracking-wide">OR</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="bg-slate-800 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 rounded-lg px-4 py-3 text-white outline-none transition w-full"
              disabled={loading}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="bg-slate-800 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 rounded-lg px-4 py-3 text-white outline-none transition w-full pr-11"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 102.8 2.8M9.9 5.1A10.8 10.8 0 0112 5c5 0 9.3 3.1 11 7-1 2.2-2.6 4.1-4.8 5.4M6.2 6.2C4.4 7.5 3 9.5 2 12c.8 1.8 2 3.4 3.6 4.7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-lg py-3.5 mt-6 font-semibold hover:opacity-90 transition shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="mt-6 flex justify-center">
              <p className="text-sm text-slate-300">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-white underline underline-offset-4 transition hover:text-slate-300"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>

      <style jsx>{`
        @keyframes loginFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </main>
  );
}


