import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import RegistrationForm from "@/components/registration";
import { useAuth } from "@/context/AuthContext";

const RegisterPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const redirect = router.query.redirect as string;
  const invite = router.query.invite;
  const inviteCode = typeof invite === 'string' ? invite : undefined;

  useEffect(() => {
    if (user) {
      router.push(redirect || "/");
    }
  }, [user, redirect, router]);

  return (
    <>
      <Head>
        <title>Sign Up – Alpine Groove Guide</title>
      </Head>
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                Alpine Groove Guide
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Create your account</h1>
              <p className="text-sm text-slate-400">
                Sign up to save shows and build a Pro page for your artist, venue, or promoter series—plus unlock Alpine Pro perks.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-black/40 backdrop-blur sm:p-8">
              <RegistrationForm
                setAuthMode={(mode) => {
                  if (mode === "login") router.push("/LoginPage");
                }}
                inviteCode={inviteCode}
                onSuccess={() => router.push("/LoginPage?redirect=/artist-signup")}
              />
            </div>
            <p className="text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/LoginPage"
                className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default RegisterPage;
