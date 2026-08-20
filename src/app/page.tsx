'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import {
  Droplets, Activity, FlaskConical, ShieldCheck, LineChart, ArrowRight,
} from 'lucide-react';

/**
 * The public front door.
 *
 * Before this, "/" bounced to the dashboard, which bounced to a login form. A
 * visitor who had never seen the product was asked for a password before being
 * told what they were signing into.
 *
 * Everything in the capability section describes what the platform actually
 * does today. Nothing here claims a feature that is not built — a landing page
 * that oversells is the first thing a client checks and the first thing they
 * stop trusting.
 */
export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden
                    bg-gradient-to-b from-[#eef4fb] via-[#f4f8fc] to-[#eaf2f7]">

      {/* Depth, in the brand's own colours. Three heavily blurred fields —
          deep blue, aqua, and the logo's green — drifting under the content.
          Fixed rather than absolute so they do not scroll away, and
          pointer-events-none so they never intercept a click. */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[18%] -left-[10%] h-[38rem] w-[38rem] rounded-full
                        bg-[#1d4ed8]/[0.16] blur-[120px]" />
        <div className="absolute top-[12%] -right-[12%] h-[34rem] w-[34rem] rounded-full
                        bg-[#0ea5e9]/[0.18] blur-[130px]" />
        <div className="absolute -bottom-[20%] left-[22%] h-[36rem] w-[36rem] rounded-full
                        bg-[#4ca64c]/[0.14] blur-[140px]" />
        <div className="absolute top-[45%] left-[45%] h-[26rem] w-[26rem] rounded-full
                        bg-[#38bdf8]/[0.10] blur-[110px]" />
      </div>

      {/* A faint grain over the gradients. Without it the blurs band visibly
          on wide monitors, which is the one thing that makes a soft background
          look cheap rather than considered. */}
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none mix-blend-multiply" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
      }} />

      {/* ── header ─────────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image
            src="/mwts-logo.png"
            alt="MWTS"
            width={240}
            height={96}
            className="h-9 w-auto object-contain"
            priority
          />

          <nav className="flex items-center gap-3">
            {/* Somebody already signed in should be offered the dashboard, not
                asked to sign in again. */}
            {!isLoading && isAuthenticated ? (
              <Link
                href="/dashboard-v2"
                className="h-9 px-4 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Open dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-9 px-4 inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="h-9 px-4 inline-flex items-center bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Request access
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── hero ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-slate-600 mb-4">
          <Droplets className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-semibold">AquaFlow</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 max-w-3xl mx-auto leading-[1.15]">
          Every reading from every plant, in one place
        </h1>

        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AquaFlow reads what your gateways already send, converts raw counts
          into engineering units, and shows what the water is doing — across
          the fleet or at a single tank.
        </p>

        <div className="mt-9 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="h-11 px-6 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg active:scale-[0.98]"
          >
            Request access
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="h-11 px-6 inline-flex items-center border border-slate-300/80 bg-white/80
            backdrop-blur-sm hover:bg-white text-slate-700 text-sm font-semibold
            rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── what it does ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Capability
            icon={Activity}
            title="Live plant monitoring"
            body="Readings arrive as the gateways send them, scaled from raw counts and checked against limits set per treatment stage."
          />
          <Capability
            icon={LineChart}
            title="Analytics from readings"
            body="Which parameters breach and where, which instruments have stopped reporting, and how much the works actually removes."
          />
          <Capability
            icon={FlaskConical}
            title="Laboratory results"
            body="COD, BOD, coliform and grab samples recorded by hand, alongside sensor data and held to the same limits."
          />
          <Capability
            icon={ShieldCheck}
            title="Access per plant"
            body="Accounts see only the sites they are granted. Corrections to recorded values keep who changed what, and when."
          />
        </div>
      </section>

      {/* ── about ──────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-white/60 bg-white/55 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            About MWTS
          </h2>
          {/* PLACEHOLDER — replace with MWTS's own description. Left
              deliberately factual and minimal rather than invented: claims
              about a company's history or scale are not ours to write. */}
          <p className="mt-4 text-slate-600 leading-relaxed">
            Murugappa Water Technology Solutions designs, builds and operates
            water treatment facilities. AquaFlow is the analytics platform for
            those plants, bringing readings from every site into one view.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Trusted Partner in Sustainability
          </p>
        </div>
      </section>

      {/* ── footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/60 bg-white/40 backdrop-blur-md mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            MWTS &middot; AquaFlow
          </p>
          <p className="text-xs text-slate-400">
            Built by YOZY
          </p>
        </div>
      </footer>
    </div>
  );
}

function Capability({ icon: Icon, title, body }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/70 rounded-xl p-5
                    shadow-[0_1px_3px_rgba(15,23,42,0.04)]
                    hover:bg-white/90 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]
                    transition-all duration-200">
      <Icon className="h-5 w-5 text-blue-500 mb-3" />
      <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-[13px] text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
