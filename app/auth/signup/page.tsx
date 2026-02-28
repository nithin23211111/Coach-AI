"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDisplayName(`${firstName} ${lastName}`.trim());
  }, [firstName, lastName]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const resolvedDisplayName = displayName.trim() || `${firstName} ${lastName}`.trim();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          display_name: resolvedDisplayName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/auth/login");
  };

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

  const inputClassName =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500";

  return (
    <main className="min-h-screen flex bg-black text-white">
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden rounded-3xl m-6 bg-gradient-to-br from-purple-700 via-indigo-800 to-black p-12 pt-12 flex-col justify-center items-center text-center">
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

        <h1 className="text-3xl mt-6 font-semibold">Get Started With Us</h1>

        <p className="text-slate-300 mt-4 max-w-md">
          Accelerate your career journey with AI-powered interview coaching, skill intelligence,
          and resume guidance in one platform.
        </p>

        <div className="space-y-4 mt-8 w-full max-w-sm">
          <button
            type="button"
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Create Account
          </button>
          <Link href="/" className="block">
            <button
              type="button"
              className="w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Explore Platform
            </button>
          </Link>
        </div>

        <Image
          src="/images/robot.png"
          alt="Decorative robot"
          width={112}
          height={112}
          className="pointer-events-none absolute left-6 top-1/3 w-32 opacity-95"
        />
        <Image
          src="/images/sphere.png"
          alt="Decorative sphere"
          width={160}
          height={160}
          className="pointer-events-none absolute right-12 top-1/4 w-44 opacity-70"
        />
        <Image
          src="/images/Codebox.png"
          alt="Decorative code icon"
          width={80}
          height={80}
          className="pointer-events-none absolute bottom-8 right-8 w-20 opacity-90"
        />
      </section>

      <section className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl p-10 border border-slate-800 ring-1 ring-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold">Sign Up Account</h2>
          <p className="mt-2 text-sm text-slate-400">Enter your details to create your account.</p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-6 w-full flex items-center justify-center gap-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 rounded-lg py-3 transition"
          >
            <Image src="/icon.svg" alt="Google icon" width={18} height={18} />
            Continue with Google
          </button>

          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-700" />
            <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                id="first-name"
                type="text"
                placeholder="First name"
                className={inputClassName}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                id="last-name"
                type="text"
                placeholder="Last name"
                className={inputClassName}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <input
              id="email"
              type="email"
              placeholder="Email"
              className={inputClassName}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={inputClassName}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
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

            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black rounded-lg py-3.5 mt-6 font-semibold hover:opacity-90 transition w-full shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <p className="mt-4 text-center text-sm text-slate-300">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-white underline underline-offset-4 transition hover:text-slate-300"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

