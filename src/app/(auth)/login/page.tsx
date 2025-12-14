'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, AlertCircle, Eye, EyeOff, Shield, Activity, Building2, Gauge, Droplets, Zap, Clock, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Panel - Branding with lighter gradient background */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 flex-col justify-between p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating circles animation */}
          <div className="absolute top-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />

          {/* Water flow lines animation */}
          <svg className="absolute bottom-0 left-0 w-full h-24 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1100,80 1150,40 1200,60 L1200,120 L0,120 Z" fill="url(#waveGradient)" className="animate-pulse">
              <animate attributeName="d" dur="10s" repeatCount="indefinite" values="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1100,80 1150,40 1200,60 L1200,120 L0,120 Z;M0,70 C150,40 350,80 500,50 C650,30 850,70 1000,50 C1100,40 1150,80 1200,50 L1200,120 L0,120 Z;M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1100,80 1150,40 1200,60 L1200,120 L0,120 Z" />
            </path>
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Centered Logo & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
              <Image
                src="/mwts-logo.png"
                alt="MWTS"
                width={72}
                height={72}
                className="h-18 w-18 object-contain relative z-10 drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AquaFlow</h1>
            <p className="text-xs text-slate-300 mt-0.5">Industrial IoT Platform</p>
          </div>

          {/* Platform Description */}
          <div className="flex-1 flex flex-col justify-center space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white mb-2">
                Water & Chemical Treatment Monitoring
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Real-time monitoring, predictive analytics, and intelligent alerts
                for industrial treatment facilities.
              </p>
            </div>

            {/* Feature Highlights - Compact 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 hover:bg-white/15 transition-all duration-300">
                <Droplets className="h-4 w-4 text-cyan-400 mb-1" />
                <p className="text-[11px] font-medium text-white">Real-time Monitoring</p>
                <p className="text-[9px] text-slate-400">Live sensor data</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 hover:bg-white/15 transition-all duration-300">
                <Zap className="h-4 w-4 text-amber-400 mb-1" />
                <p className="text-[11px] font-medium text-white">Predictive Analytics</p>
                <p className="text-[9px] text-slate-400">AI-powered insights</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 hover:bg-white/15 transition-all duration-300">
                <Clock className="h-4 w-4 text-emerald-400 mb-1" />
                <p className="text-[11px] font-medium text-white">24/7 Alerts</p>
                <p className="text-[9px] text-slate-400">Instant notifications</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 hover:bg-white/15 transition-all duration-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mb-1" />
                <p className="text-[11px] font-medium text-white">Compliance Ready</p>
                <p className="text-[9px] text-slate-400">Automated reports</p>
              </div>
            </div>

            {/* System Status Indicators - Compact */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
                Live System Status
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 bg-white/5 rounded px-2.5 py-2 hover:bg-white/10 transition-colors">
                  <div className="h-7 w-7 rounded bg-emerald-500/20 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">5 Plants Online</p>
                    <p className="text-[9px] text-slate-400">All systems operational</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-400 font-mono">LIVE</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded px-2.5 py-2 hover:bg-white/10 transition-colors">
                  <div className="h-7 w-7 rounded bg-blue-500/20 flex items-center justify-center">
                    <Gauge className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">247 Sensors Active</p>
                    <p className="text-[9px] text-slate-400">Real-time data streaming</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[8px] text-blue-400 font-mono">SYNC</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded px-2.5 py-2 hover:bg-white/10 transition-colors">
                  <div className="h-7 w-7 rounded bg-amber-500/20 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">99.9% Uptime</p>
                    <p className="text-[9px] text-slate-400">Last 30 days</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-[8px] text-amber-400 font-mono">OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 text-center">
          <p className="text-[9px] text-slate-400">
            © 2024 MWTS | Powered by YOZY
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            Version 2.1.0 | Support: support@yozy.com
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          {/* Mobile Logo - Centered and Larger */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-slate-200 rounded-full blur-xl" />
              <Image
                src="/mwts-logo.png"
                alt="MWTS"
                width={64}
                height={64}
                className="h-16 w-16 object-contain relative z-10"
              />
            </div>
            <h1 className="text-xl font-bold text-slate-800">AquaFlow</h1>
            <p className="text-[10px] text-slate-500">Industrial IoT Platform</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden">
            {/* Card Header */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Secure Sign In
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Enter your credentials to access the control center
              </p>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-medium rounded">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="email" className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 bg-white border-2 border-slate-200 rounded text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full h-10 px-3 pr-10 bg-white border-2 border-slate-200 rounded text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

            </div>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-4 text-center">
            <p className="text-[9px] text-slate-500">
              © 2024 MWTS | Powered by YOZY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
