'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

/**
 * Creating an account.
 *
 * Signing up does not grant access. A new account gets the lowest role and no
 * plants until an administrator raises it — otherwise anyone who can reach this
 * page can read the fleet. The page says so before asking for a password,
 * rather than letting somebody sign up and then wonder why nothing loads.
 */
export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();

  // Checked here so the message is immediate, and again by the API because a
  // browser check is a courtesy rather than a control.
  const tooShort = password.length > 0 && password.length < 10;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = name.trim() && email.includes('@') && password.length >= 10
                && confirm === password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    setNotice('');
    const message = await register(email.trim(), password, name.trim());
    // register() returns null when it signed us in, and a message otherwise —
    // which may be an error or "check your email", so it is shown as a notice
    // unless it reads like a failure.
    if (message) {
      if (/could not|incorrect|already/i.test(message)) setError(message);
      else setNotice(message);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md">
        <div className="border-2 border-slate-300 bg-white">
          <div className="bg-slate-800 px-5 py-3">
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Create an account
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              AquaFlow &middot; MWTS water treatment analytics
            </p>
          </div>

          <form onSubmit={submit} className="p-5 space-y-3.5">
            <div className="border-l-4 border-blue-500 bg-blue-50 px-3 py-2">
              <p className="text-[11px] text-blue-900">
                A new account starts with no access to any plant. An
                administrator grants it after the account exists.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 border-l-4 border-red-500
                              bg-red-50 px-3 py-2 text-xs text-red-900">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2 border-l-4 border-emerald-500
                              bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <Field label="Full name">
              <input value={name} onChange={(e) => setName(e.target.value)}
                     autoComplete="name" className={INPUT} required />
            </Field>

            <Field label="Work email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     autoComplete="email" className={INPUT} required />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={INPUT + (tooShort ? ' border-red-400' : '')}
                  required
                />
                <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400
                                   hover:text-slate-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className={`text-[11px] mt-1 ${tooShort ? 'text-red-600' : 'text-slate-400'}`}>
                At least 10 characters.
              </p>
            </Field>

            <Field label="Confirm password">
              <input
                type={show ? 'text' : 'password'}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={INPUT + (mismatch ? ' border-red-400' : '')}
                required
              />
              {mismatch && (
                <p className="text-[11px] text-red-600 mt-1">
                  These do not match.
                </p>
              )}
            </Field>

            <button type="submit" disabled={busy || !ready}
                    className="w-full h-9 text-xs font-bold uppercase tracking-wide
                               bg-slate-800 text-white hover:bg-slate-900
                               disabled:bg-slate-300 disabled:cursor-not-allowed
                               transition-colors flex items-center justify-center gap-2">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {busy ? 'Creating…' : 'Create account'}
            </button>

            <p className="text-[11px] text-slate-500 text-center pt-1">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-slate-700 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const INPUT = 'w-full h-9 px-3 text-sm border border-slate-300 bg-white '
            + 'focus:outline-none focus:border-blue-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
