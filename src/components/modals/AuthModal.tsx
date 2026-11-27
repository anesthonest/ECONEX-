/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Authentication & User Registration Modal
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { UserRole } from '../../types/index.ts';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'LOGIN' | 'REGISTER' | 'RECOVER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'REGISTER' }) => {
  const { login, register, currentUser, role: currentRole, refreshUsers } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RECOVER'>(defaultMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+256 7');
  const [role, setRole] = useState<UserRole>('FARMER');
  const [organizationName, setOrganizationName] = useState('');
  const [district, setDistrict] = useState('Mbale');
  const [bio, setBio] = useState('');
  const [recoveryTarget, setRecoveryTarget] = useState('');
  const [recoveryRequestId, setRecoveryRequestId] = useState<string | null>(null);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestRecovery = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setRecoveryMessage(null);
    try {
      const target = recoveryTarget.trim() || currentUser?.email || email.trim();
      const res = await ApiClient.v26RequestRecoveryOrVerification(
        {
          requestType: 'ACCESS_RECOVERY',
          contactChannel: target.includes('@') ? 'EMAIL' : 'PHONE_SMS',
          contactTarget: target,
        },
        { userId: currentUser?.id || 'usr_farmer_01', userRole: currentRole }
      );
      setRecoveryRequestId(res.request?.id || null);
      setSandboxOtp(res.sandboxVerificationCode || null);
      setRecoveryMessage(res.honestyNotice || 'Sandbox recovery token generated locally.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to create recovery challenge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyRecovery = async () => {
    if (!recoveryRequestId || !recoveryCode.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await ApiClient.v26VerifyRecoveryOrContact(
        { requestId: recoveryRequestId, code: recoveryCode.trim() },
        { userId: currentUser?.id || 'usr_farmer_01', userRole: currentRole }
      );
      if (res.verified) {
        setRecoveryMessage('Recovery challenge verified and logged.');
        await refreshUsers();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'RECOVER') {
      if (recoveryRequestId && recoveryCode.trim()) {
        await handleVerifyRecovery();
      } else {
        await handleRequestRecovery();
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (mode === 'LOGIN') {
        await login(email);
      } else {
        await register({
          name,
          email,
          phone,
          role,
          organizationName,
          district,
          bio,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ugandanDistricts = [
    'Mbale',
    'Kampala',
    'Gulu',
    'Jinja',
    'Kasese',
    'Mbarara',
    'Masaka',
    'Arua',
    'Tororo',
    'Lira',
    'Soroti',
    'Kabale',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#D4AF37]">Æ</span>
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              {mode === 'LOGIN'
                ? 'Login to ECONEX'
                : mode === 'RECOVER'
                  ? 'Access Recovery (Sandbox)'
                  : 'Register Stakeholder Account'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer">
            ✕
          </button>
        </div>

        {/* Mode switch */}
        <div className="flex rounded-lg bg-[#18181b] p-1 border border-[#27272a] text-xs gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'REGISTER' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-[#A0A0A0]'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'LOGIN' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-[#A0A0A0]'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('RECOVER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'RECOVER' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-[#A0A0A0]'
            }`}
          >
            Recover Access
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {recoveryMessage && (
          <div className="p-3 bg-[#18181b] border border-[#D4AF37] text-[#D4AF37] rounded text-xs flex items-start gap-2">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{recoveryMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'RECOVER' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Registered Email or Phone</label>
                <input
                  type="text"
                  placeholder={currentUser?.email || 'sarah.namubiru@farm.aros.ug'}
                  value={recoveryTarget}
                  onChange={(e) => setRecoveryTarget(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>
              {sandboxOtp && (
                <div className="space-y-2 p-3 rounded bg-[#18181b] border border-[#27272a]">
                  <div className="text-[#D4AF37] font-mono">
                    Sandbox Verification Code: <strong>{sandboxOtp}</strong>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit sandbox code"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full bg-[#121212] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
                  />
                </div>
              )}
            </div>
          ) : mode === 'LOGIN' ? (
            <div>
              <label className="block text-[#A0A0A0] mb-1">Registered Account Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. sarah.namubiru@farm.aros.ug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
              />
              <div className="mt-2 text-[10px] text-[#71717a]">
                Tip: You can also switch active accounts under Account settings to test all stakeholder personas.
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[#A0A0A0] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Mukasa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@econex.ug"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Mobile Phone (MoMo) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+256 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Economic Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="FARMER">Smallholder Farmer</option>
                    <option value="BUYER">Commercial Food Buyer</option>
                    <option value="AGRO_DEALER">Agro-Dealer (Inputs / Seed)</option>
                    <option value="COOPERATIVE_ADMIN">Cooperative Union Leader</option>
                    <option value="TRANSPORTER">Logistics Carrier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] mb-1">Ugandan District *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    {ugandanDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d} District
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Organization / Enterprise Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bugisu Arabica Farm, Nile Millers Ltd"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Brief Description / Farm Profile</label>
                <textarea
                  rows={2}
                  placeholder="Commodities produced, vehicle capacity, or procurement focus..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] disabled:opacity-50 text-black font-semibold rounded shadow-md cursor-pointer"
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'RECOVER'
                  ? recoveryRequestId
                    ? 'Verify Code'
                    : 'Issue Sandbox Code'
                  : mode === 'LOGIN'
                    ? 'Login'
                    : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
