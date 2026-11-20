/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Authentication & User Registration Modal
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';
import { UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'REGISTER' }) => {
  const { login, register, availableUsers } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(defaultMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+256 7');
  const [role, setRole] = useState<UserRole>('FARMER');
  const [organizationName, setOrganizationName] = useState('');
  const [district, setDistrict] = useState('Mbale');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              {mode === 'LOGIN' ? 'Login to ECONEX' : 'Register Stakeholder Account'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
            ✕
          </button>
        </div>

        {/* Mode switch */}
        <div className="flex rounded-lg bg-[#18181b] p-1 border border-[#27272a] text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
              mode === 'REGISTER' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-[#A0A0A0]'
            }`}
          >
            New Stakeholder Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
              mode === 'LOGIN' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-[#A0A0A0]'
            }`}
          >
            Direct Login
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'LOGIN' ? (
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
                Tip: You can also use the persona dropdown switcher in the top navigation bar to test all preloaded demo accounts.
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
              className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] disabled:opacity-50 text-black font-semibold rounded shadow-md"
            >
              {isSubmitting ? 'Authenticating...' : mode === 'LOGIN' ? 'Login' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
