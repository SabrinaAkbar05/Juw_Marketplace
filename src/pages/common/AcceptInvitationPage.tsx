import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Store,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { api, json } from '../../lib/api';
import { Button } from '../../components/common/Button';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [destinationRole, setDestinationRole] = useState<'ADMIN' | 'SELLER'>('SELLER');

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token. Please check the link provided by your administrator.');
      setIsLoading(false);
      return;
    }

    // Verify token with backend
    api<{ ok: boolean; invitation: any }>(`/api/invitations/verify?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setInvitation(data.invitation);
        setName(data.invitation.fullName || '');
        setDestinationRole(data.invitation.type === 'ADMIN_INVITATION' ? 'ADMIN' : 'SELLER');
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Invitation token is invalid, expired, or has already been used.');
        setIsLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api<{ ok: boolean; role: string; email: string }>('/api/invitations/accept', json('POST', {
        token,
        name: name.trim(),
        password,
      }));

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-200/40 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden animate-fade-in">
        {/* Banner */}
        <div className="bg-juw-navy-950 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
            {destinationRole === 'ADMIN' ? (
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            ) : (
              <Store className="w-7 h-7 text-emerald-400" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display">
            JUW Marketplace Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Jinnah University for Women • Official Platform Registration
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {isLoading ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-8 h-8 border-3 border-juw-navy-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Verifying invitation token with university servers...</p>
            </div>
          ) : error && !invitation ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Invitation Expired or Invalid</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {error}
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  Back to Marketplace
                </Button>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Account Activated Successfully!</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your credentials have been securely registered with Firebase Authentication and your{' '}
                <strong className="text-slate-900">{invitation.email}</strong> account is now granted{' '}
                <strong>{destinationRole === 'ADMIN' ? 'Administrative' : 'Student Seller'}</strong> privileges.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
                {destinationRole === 'ADMIN' ? (
                  <Button variant="primary" size="md" onClick={() => navigate('/admin')}>
                    Go to Admin Portal
                  </Button>
                ) : (
                  <Button variant="emerald" size="md" onClick={() => navigate('/seller')}>
                    Open Seller Studio
                  </Button>
                )}
                <Button variant="outline" size="md" onClick={() => navigate('/')}>
                  Marketplace Home
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invitation Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Invitation Details
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    Authorized
                  </span>
                </div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">
                    {invitation.fullName}
                  </strong>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {invitation.email}
                  </span>
                </div>

                {invitation.type === 'SELLER_INVITATION' ? (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs space-y-1">
                    <p className="text-slate-700">
                      Storefront: <strong className="text-emerald-800">{invitation.storeName}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Faculty: {invitation.department} • {invitation.semester}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                    <p className="text-indigo-900 font-semibold">
                      Appointed Role: <strong>{invitation.role}</strong>
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Set Password / Activate Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create Secure Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-juw-navy-900 focus:bg-white"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Accept Invitation & Activate Account
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
